/**
 * RLS 設定の検証スクリプト (TSK-67)
 *
 * Usage:
 *   npm run check:rls
 *   npx dotenv -e .env.local      -- node scripts/check-rls.mjs
 *   npx dotenv -e .env.production -- node scripts/check-rls.mjs
 *
 * 目的:
 *   public スキーマのテーブル／ビューが PostgREST・GraphQL から読めない状態に
 *   保たれているかを検査する。1 件でも問題があれば非ゼロ終了する。
 *
 *   Supabase では postgres ロールでイベントトリガーを作れないため、新規テーブルの
 *   RLS 有効化を DB 側で強制できない。マイグレーションを追加したら（特に新しい
 *   テーブルを作ったら）このスクリプトを実行すること。
 */
import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

/** 検証で見つかった問題 */
const failures = [];
/** 参考情報（失敗にはしない） */
const warnings = [];

/**
 * RLS が無効なテーブルを検出する
 * @return {Promise<number>} RLS が無効なテーブルの件数
 */
async function checkRlsEnabled() {
    const rows = await prisma.$queryRaw`
        SELECT tablename::text AS tablename
          FROM pg_tables
         WHERE schemaname = 'public'
           AND rowsecurity = false
         ORDER BY tablename
    `;

    if (rows.length > 0) {
        failures.push(
            `RLS が無効なテーブルが ${rows.length} 件あります: ${rows.map((r) => r.tablename).join(", ")}\n` +
                `    → ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY; を実行するマイグレーションを追加してください。`
        );
    }
    return rows.length;
}

/**
 * anon / authenticated に残っているテーブル権限を検出する。
 *
 * pg_default_acl には supabase_admin が付与したデフォルト権限（anon / authenticated を含む）が
 * 残っているが、postgres ロールからは剥がせない。Prisma のマイグレーションは postgres として
 * 実行されるため実害は無く、万一権限が付いたテーブルが現れてもこの検査で捕捉できる。
 * @return {Promise<number>} 権限が残っているオブジェクトの件数
 */
async function checkNoGrants() {
    const rows = await prisma.$queryRaw`
        SELECT table_name::text AS table_name,
               grantee::text AS grantee,
               string_agg(privilege_type, ', ' ORDER BY privilege_type)::text AS privileges
          FROM information_schema.role_table_grants
         WHERE table_schema = 'public'
           AND grantee IN ('anon', 'authenticated')
         GROUP BY table_name, grantee
         ORDER BY table_name, grantee
    `;

    if (rows.length > 0) {
        failures.push(
            `anon / authenticated に権限が残っているオブジェクトが ${rows.length} 件あります:\n` +
                rows.map((r) => `      - ${r.table_name} / ${r.grantee}: ${r.privileges}`).join("\n") +
                `\n    → REVOKE ALL ON public.<object> FROM anon, authenticated; を実行してください。`
        );
    }
    return rows.length;
}

/**
 * security_invoker が付いていないビューを検出する。
 * これが無いとビュー経由で参照元テーブルの RLS を迂回できてしまう。
 * @return {Promise<number>} 検査したビューの件数
 */
async function checkViewsSecurityInvoker() {
    const rows = await prisma.$queryRaw`
        SELECT c.relname::text AS relname,
               COALESCE(array_to_string(c.reloptions, ', '), '')::text AS reloptions
          FROM pg_class c
         WHERE c.relnamespace = 'public'::regnamespace
           AND c.relkind = 'v'
         ORDER BY c.relname
    `;

    const bad = rows.filter((r) => !r.reloptions.includes("security_invoker=true"));
    if (bad.length > 0) {
        failures.push(
            `security_invoker が設定されていないビューが ${bad.length} 件あります: ${bad
                .map((r) => r.relname)
                .join(", ")}\n` +
                `    → ALTER VIEW public.<view> SET (security_invoker = true); を実行してください。\n` +
                `       supabase/sql/views.sql を手動実行した直後は設定が失われている可能性があります。`
        );
    }
    return rows.length;
}

/**
 * FORCE ROW LEVEL SECURITY が誤って有効になっていないか検査する。
 *
 * これが有効だと所有者（= Prisma が使う postgres）にも RLS が適用され、
 * ポリシーが無い今の構成ではアプリが全面的に動かなくなる。
 * @return {Promise<number>} FORCE RLS が有効なテーブルの件数
 */
async function checkNoForceRls() {
    const rows = await prisma.$queryRaw`
        SELECT relname::text AS relname
          FROM pg_class
         WHERE relnamespace = 'public'::regnamespace
           AND relkind = 'r'
           AND relforcerowsecurity = true
         ORDER BY relname
    `;

    if (rows.length > 0) {
        failures.push(
            `FORCE ROW LEVEL SECURITY が有効なテーブルが ${rows.length} 件あります: ${rows
                .map((r) => r.relname)
                .join(", ")}\n` +
                `    → 所有者にも RLS が適用されるため Prisma 経由のアプリが動かなくなります。\n` +
                `       ALTER TABLE public.<table> NO FORCE ROW LEVEL SECURITY; で解除してください。`
        );
    }
    return rows.length;
}

/**
 * 認可ヘルパー関数が SECURITY DEFINER で存在するか検査する。
 * Realtime のチャンネル認可ポリシーが依存している。
 * @return {Promise<number>} 見つかったヘルパー関数の件数
 */
async function checkHelperFunctions() {
    const expected = ["current_app_user_id", "is_event_admin", "is_event_attendee", "is_master_admin"];

    const rows = await prisma.$queryRaw`
        SELECT proname::text AS proname, prosecdef
          FROM pg_proc
         WHERE pronamespace = 'public'::regnamespace
         ORDER BY proname
    `;

    const byName = new Map(rows.map((r) => [r.proname, r]));
    const missing = expected.filter((name) => !byName.has(name));
    const notDefiner = expected.filter((name) => byName.has(name) && byName.get(name).prosecdef !== true);

    if (missing.length > 0) {
        failures.push(
            `認可ヘルパー関数が見つかりません: ${missing.join(", ")}\n` +
                `    → TSK-67 のマイグレーションが適用されていない可能性があります。`
        );
    }
    if (notDefiner.length > 0) {
        failures.push(
            `SECURITY DEFINER になっていない認可ヘルパー関数があります: ${notDefiner.join(", ")}\n` +
                `    → 権限を剥奪した後は関数内部からテーブルを参照できなくなります。`
        );
    }
    return expected.length - missing.length;
}

/**
 * 参考情報: postgres が剥がせない supabase_admin のデフォルト権限を警告として記録する
 * @return {Promise<void>}
 */
async function noteSupabaseAdminDefaults() {
    const rows = await prisma.$queryRaw`
        SELECT d.defaclobjtype::text AS objtype
          FROM pg_default_acl d
          JOIN pg_namespace n ON n.oid = d.defaclnamespace
          JOIN pg_roles r ON r.oid = d.defaclrole
         WHERE n.nspname = 'public'
           AND r.rolname = 'supabase_admin'
           AND d.defaclacl::text LIKE '%anon=%'
    `;

    if (rows.length > 0) {
        warnings.push(
            `supabase_admin が付与したデフォルト権限に anon / authenticated が残っています（${rows.length} 件）。\n` +
                `    postgres ロールからは剥がせません（permission denied to change default privileges）。\n` +
                `    Prisma のマイグレーションは postgres として実行されるため新規テーブルには影響しませんが、\n` +
                `    Studio 等から supabase_admin でテーブルを作った場合は権限が付きます。\n` +
                `    その場合も「anon / authenticated への残存権限」の検査で検出されます。`
        );
    }
}

/**
 * 検証を実行する
 * @return {Promise<void>}
 */
async function main() {
    console.log("🔍 RLS 設定を検証します...\n");

    const tableCount = await prisma.$queryRaw`
        SELECT count(*)::int AS count FROM pg_tables WHERE schemaname = 'public'
    `;

    const rlsDisabled = await checkRlsEnabled();
    const grantCount = await checkNoGrants();
    const viewCount = await checkViewsSecurityInvoker();
    const forceCount = await checkNoForceRls();
    const helperCount = await checkHelperFunctions();
    await noteSupabaseAdminDefaults();

    console.log(`  対象テーブル数                     : ${tableCount[0].count}`);
    console.log(`  RLS 無効なテーブル                 : ${rlsDisabled}  (期待値 0)`);
    console.log(`  anon/authenticated への残存権限    : ${grantCount}  (期待値 0)`);
    console.log(`  ビュー数 (security_invoker 検査済) : ${viewCount}`);
    console.log(`  FORCE RLS 有効なテーブル           : ${forceCount}  (期待値 0)`);
    console.log(`  認可ヘルパー関数                   : ${helperCount} / 4`);
    console.log("");

    for (const warning of warnings) {
        console.log(`ℹ️  ${warning}\n`);
    }

    if (failures.length > 0) {
        console.error(`❌ ${failures.length} 件の問題が見つかりました:\n`);
        for (const failure of failures) {
            console.error(`  - ${failure}\n`);
        }
        process.exitCode = 1;
        return;
    }

    console.log("✅ RLS 設定に問題はありません。");
}

main()
    .catch((error) => {
        console.error("❌ 検証中にエラーが発生しました:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
