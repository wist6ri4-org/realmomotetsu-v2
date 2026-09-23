/**
 * Prisma migration に含められない手動SQL（Storage/Realtimeのポリシー）を一括実行する。
 *
 * `storage.objects` / `realtime.messages` はそれぞれ所有者が
 * `supabase_storage_admin` / `supabase_realtime_admin` であり、Prisma が接続する
 * `postgres` ロールでは `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` のような
 * 所有者限定の操作は実行できない（`must be owner of table ...`）。一方で
 * `CREATE POLICY` / `DROP POLICY` は `postgres` ロールでも実行できるため、
 * このスクリプトで両ファイルの内容を一括適用できる。
 *
 * Supabase ダッシュボードの SQL Editor に貼り付けて実行するのと等価な操作を、
 * Prisma の接続情報（DIRECT_URL）を使ってコマンドラインから行う。
 *
 * Usage:
 *   npm run apply:manual-sql                                   # ローカル環境（.env.local）
 *   npx dotenv -e .env.production -- node scripts/apply-manual-sql.mjs  # 本番環境
 *
 * 再実行しても安全（各ファイルは DROP POLICY IF EXISTS → CREATE POLICY の順で書かれている）。
 */
import { PrismaClient } from "../src/generated/prisma/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, "..");

/** 適用対象のSQLファイル（この順番で実行する） */
const TARGET_FILES = ["supabase/sql/create_storage_policies.sql", "supabase/sql/create_realtime_policies.sql"];

/**
 * 所有者チェックで弾かれるだけの想定内のエラーかどうかを判定する。
 * @param {unknown} error - 発生したエラー
 * @return {boolean} 想定内のエラーであればtrue
 */
const isTolerableError = (error) => {
    const message = extractErrorMessage(error);
    return /must be owner of (table|relation)/i.test(message);
};

/**
 * エラーメッセージから表示用の1行を取り出す。
 * PrismaのRawクエリエラーは複数行のスタックトレース風メッセージになるため、
 * 実際のPostgresエラー行（`Message: ...`）だけを抜き出す。
 * @param {unknown} error - 発生したエラー
 * @return {string} 表示用のメッセージ
 */
const extractErrorMessage = (error) => {
    const raw = error instanceof Error ? error.message : String(error);
    const match = raw.match(/Message: `([^`]+)`/);
    return (match ? match[1] : raw).replace(/\s+/g, " ").trim();
};

/**
 * SQLファイルの内容を実行可能な文の配列に分割する。
 *
 * `--` から行末までのコメントを除去してから `;` で分割する。
 * 対象2ファイルには `$$ ... $$`（PL/pgSQL関数本体）を含む文が無いことを確認済みのため、
 * この単純な分割で安全に扱える。将来ファイルを追加する場合は、この前提が崩れていないか確認すること。
 *
 * @param {string} sql - SQLファイルの内容
 * @return {string[]} 実行可能な文の配列
 */
const splitStatements = (sql) => {
    const withoutComments = sql
        .split("\n")
        .map((line) => {
            const idx = line.indexOf("--");
            return idx === -1 ? line : line.slice(0, idx);
        })
        .join("\n");

    return withoutComments
        .split(";")
        .map((statement) => statement.trim())
        .filter((statement) => statement.length > 0);
};

/**
 * 1つのSQL文を実行する。SELECT文の場合は結果を表示する。
 * @param {PrismaClient} prisma - Prismaクライアント
 * @param {string} statement - 実行するSQL文
 * @return {Promise<{ ok: boolean; tolerated: boolean }>} 実行結果
 */
const runStatement = async (prisma, statement) => {
    const label = statement.replace(/\s+/g, " ").slice(0, 70);
    try {
        const rows = await prisma.$queryRawUnsafe(statement);
        if (Array.isArray(rows) && rows.length > 0) {
            console.log(`  ✅ ${label}`);
            console.table(rows);
        } else {
            console.log(`  ✅ ${label}`);
        }
        return { ok: true, tolerated: false };
    } catch (error) {
        if (isTolerableError(error)) {
            console.log(`  ℹ️  ${label}`);
            console.log(`      → ${extractErrorMessage(error)}（想定内。既にRLSが有効なため無視してよい）`);
            return { ok: true, tolerated: true };
        }
        console.error(`  ❌ ${label}`);
        console.error(`      → ${extractErrorMessage(error)}`);
        return { ok: false, tolerated: false };
    }
};

/**
 * 1ファイル分のSQLを実行する
 * @param {PrismaClient} prisma - Prismaクライアント
 * @param {string} relativePath - リポジトリルートからの相対パス
 * @return {Promise<{ failed: number; tolerated: number }>} 実行結果の集計
 */
const runFile = async (prisma, relativePath) => {
    console.log(`\n=== ${relativePath} ===`);
    const absolutePath = path.join(rootDir, relativePath);
    const sql = fs.readFileSync(absolutePath, "utf-8");
    const statements = splitStatements(sql);

    let failed = 0;
    let tolerated = 0;
    for (const statement of statements) {
        const result = await runStatement(prisma, statement);
        if (!result.ok) {
            failed += 1;
        } else if (result.tolerated) {
            tolerated += 1;
        }
    }
    return { failed, tolerated };
};

/**
 * 一括実行のエントリーポイント
 * @return {Promise<void>}
 */
async function main() {
    // DIRECT_URL（プーラーを経由しない直接接続）を明示的に使う。マイグレーションと同じ接続先。
    const datasourceUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!datasourceUrl) {
        console.error("❌ DIRECT_URL（またはDATABASE_URL）が設定されていません。");
        console.error("   例: npx dotenv -e .env.local -- node scripts/apply-manual-sql.mjs");
        process.exitCode = 1;
        return;
    }

    const prisma = new PrismaClient({ datasourceUrl });

    console.log("🔧 Storage / Realtime の手動SQLを適用します...");

    let totalFailed = 0;
    let totalTolerated = 0;
    try {
        for (const file of TARGET_FILES) {
            const { failed, tolerated } = await runFile(prisma, file);
            totalFailed += failed;
            totalTolerated += tolerated;
        }
    } finally {
        await prisma.$disconnect();
    }

    console.log("");
    if (totalFailed > 0) {
        console.error(`❌ ${totalFailed} 件の文が失敗しました。上のログを確認してください。`);
        process.exitCode = 1;
        return;
    }

    console.log(
        `✅ すべて適用できました${totalTolerated > 0 ? `（想定内のエラーを ${totalTolerated} 件無視しました）` : ""}。`
    );
}

main().catch((error) => {
    console.error("❌ 実行中にエラーが発生しました:", error);
    process.exitCode = 1;
});
