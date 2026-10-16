-- ===========================================================================
-- TSK-67 RLS lockdown
--
-- 目的:
--   Prisma は postgres ロール（テーブル所有者）で接続しているため、RLS はアプリの
--   クエリには影響しない。このマイグレーションが守るのは、ブラウザに露出している
--   NEXT_PUBLIC_SUPABASE_PUBLISHED_KEY で誰でも叩ける PostgREST / GraphQL
--   (/rest/v1/*, /graphql/v1) の経路である。
--
--   RLS を deny-all（ポリシーを 1 つも作らない）で有効化し、さらに anon /
--   authenticated からテーブル権限そのものを剥奪する二重防御とする。
--
-- 注意:
--   FORCE ROW LEVEL SECURITY は絶対に使わない。所有者にも RLS が適用され、
--   Prisma 経由のアプリが全滅する。
-- ===========================================================================


-- ---------------------------------------------------------------------------
-- 1. 認可ヘルパー関数
--
--   auth.uid() (Supabase Auth の UUID) と public.users.uuid を突き合わせて
--   アプリ内のユーザー ID / ロールを解決する。FK は無く、リンクはアプリコード
--   (src/lib/auth.ts の signUp) が維持している。
--
--   - SECURITY DEFINER: 所有者 postgres として実行されるため、下の REVOKE で
--     テーブル権限を剥がした後も関数内部からは参照できる（RLS も迂回する）。
--   - LANGUAGE plpgsql: 本体が作成時に名前解決されないため、auth スキーマが
--     存在しない環境（prisma migrate dev のシャドー DB 等）でも CREATE できる。
-- ---------------------------------------------------------------------------

-- ログイン中ユーザーの public.users.id を返す（未ログイン・未登録なら NULL）
CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id integer;
BEGIN
    SELECT u.id
      INTO v_user_id
      FROM public.users u
     WHERE u.uuid = auth.uid()::text;

    RETURN v_user_id;
END;
$$;

COMMENT ON FUNCTION public.current_app_user_id() IS
    'auth.uid() に対応する public.users.id を返す。TSK-67';

-- 恒久ロール（users.master_role）が admin かどうか
CREATE OR REPLACE FUNCTION public.is_master_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_admin boolean;
BEGIN
    SELECT u.master_role = 'admin'::public."Role"
      INTO v_is_admin
      FROM public.users u
     WHERE u.uuid = auth.uid()::text;

    RETURN COALESCE(v_is_admin, false);
END;
$$;

COMMENT ON FUNCTION public.is_master_admin() IS
    'ログイン中ユーザーの master_role が admin かどうか。TSK-67';

-- 指定イベントの参加者かどうか（attendances に行があるか）
CREATE OR REPLACE FUNCTION public.is_event_attendee(p_event_code text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_attendee boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
          FROM public.attendances a
          JOIN public.users u ON u.id = a.user_id
         WHERE u.uuid = auth.uid()::text
           AND a.event_code = p_event_code
    ) INTO v_is_attendee;

    RETURN COALESCE(v_is_attendee, false);
END;
$$;

COMMENT ON FUNCTION public.is_event_attendee(text) IS
    'ログイン中ユーザーが指定イベントの参加者かどうか。TSK-67';

-- 指定イベントの管理者かどうか（master_role=admin または当該イベントの event_role=admin）
CREATE OR REPLACE FUNCTION public.is_event_admin(p_event_code text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_admin boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
          FROM public.users u
          LEFT JOIN public.attendances a
                 ON a.user_id = u.id
                AND a.event_code = p_event_code
         WHERE u.uuid = auth.uid()::text
           AND (
               u.master_role = 'admin'::public."Role"
               OR a.event_role = 'admin'::public."Role"
           )
    ) INTO v_is_admin;

    RETURN COALESCE(v_is_admin, false);
END;
$$;

COMMENT ON FUNCTION public.is_event_admin(text) IS
    'ログイン中ユーザーが指定イベントの管理者かどうか。TSK-67';


-- ---------------------------------------------------------------------------
-- 2. public スキーマの全テーブルで RLS を有効化（ポリシーは作らない = deny-all）
--
--   テーブル追加漏れを防ぐため pg_tables を回す。将来テーブルが増えた場合も
--   このブロックを再実行すれば効く（冪等）。
-- ---------------------------------------------------------------------------

DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT tablename
          FROM pg_tables
         WHERE schemaname = 'public'
         ORDER BY tablename
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE 'RLS enabled: public.%', r.tablename;
    END LOOP;
END;
$$;


-- ---------------------------------------------------------------------------
-- 3. ビューの再作成（security_invoker）
--
--   latest_transit_stations / bombii_counts は prisma/schema.prisma に view として
--   宣言されているが、Prisma は view の DDL を出さないためマイグレーションに存在せず、
--   supabase/sql/views.sql の手動実行で作られていた（新規環境では欠落する）。
--   ここでマイグレーション管理下に置く。
--
--   ビューは RLS を持てないため security_invoker = true を付け、参照元テーブルの
--   RLS が「ビューの所有者」ではなく「クエリ実行者」に対して評価されるようにする。
--   Supabase Advisor の "security definer view" 警告も解消される。
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.latest_transit_stations
WITH (security_invoker = true) AS
SELECT DISTINCT ON (team_code, event_code) *
  FROM public.transit_stations
 ORDER BY team_code, event_code, created_at DESC;

CREATE OR REPLACE VIEW public.bombii_counts
WITH (security_invoker = true) AS
SELECT event_code,
       team_code,
       COUNT(*) AS count
  FROM public.bombii_histories
 GROUP BY event_code, team_code
 ORDER BY team_code;


-- ---------------------------------------------------------------------------
-- 4. anon / authenticated からの権限剥奪
--
--   Supabase のデフォルトでは anon / authenticated に public スキーマの全テーブルへ
--   ALL が付いている。RLS の deny-all だけでも止まるが、権限そのものも剥がして
--   二重防御にする（エラーが "permission denied" になり意図が明確になる）。
--
--   ALTER DEFAULT PRIVILEGES が重要: これが無いと、今後 Prisma が新しいテーブルを
--   作るたびに anon / authenticated へ自動で GRANT され、穴が再発する。
--
--   GRANT USAGE ON SCHEMA public は剥がさない。剥がすと Supabase 内部の名前解決に
--   影響しかねず、テーブルレベルの REVOKE + RLS で目的は達成できる。
--
--   ロール自体が存在しない環境（Supabase 以外の Postgres、CI 等）でも失敗しないよう
--   ロールの存在を確認してから実行する。
-- ---------------------------------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
       OR NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        RAISE NOTICE 'anon / authenticated ロールが存在しないため権限剥奪をスキップします';
        RETURN;
    END IF;

    -- 既存オブジェクトの権限を剥奪
    REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
    REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

    -- 今後作られるオブジェクトにも自動 GRANT されないようにする
    ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
        REVOKE ALL ON TABLES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
        REVOKE ALL ON SEQUENCES FROM anon, authenticated;
    ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
        REVOKE ALL ON FUNCTIONS FROM anon, authenticated;

    -- 認可ヘルパーだけは authenticated に開ける（Realtime のポリシーが使う）。
    -- anon には渡さない。
    GRANT EXECUTE ON FUNCTION public.current_app_user_id()      TO authenticated;
    GRANT EXECUTE ON FUNCTION public.is_master_admin()          TO authenticated;
    GRANT EXECUTE ON FUNCTION public.is_event_attendee(text)    TO authenticated;
    GRANT EXECUTE ON FUNCTION public.is_event_admin(text)       TO authenticated;
END;
$$;
