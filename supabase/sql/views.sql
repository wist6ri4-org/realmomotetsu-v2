-- ビューを作成するSQLスクリプト
--
-- 注意 (TSK-67):
--   ビューの正は prisma/migrations/20260916221221_tsk_67_rls_lockdown/migration.sql。
--   このファイルは prisma/seed.mjs から実行されるほか、手動実行の経路としても残している。
--   両者の定義を必ず一致させること。特に security_invoker = true を落とすと、
--   ビュー経由で参照元テーブルの RLS を迂回できてしまう。
--
--   CREATE VIEW ではなく CREATE OR REPLACE VIEW を使う。seed.mjs の executeSQLFile は
--   "CREATE VIEW" を検出すると DROP VIEW してから作り直す実装になっており、
--   そのままだと security_invoker の設定が失われる。

CREATE OR REPLACE VIEW
    latest_transit_stations
WITH
    (security_invoker = true) AS
SELECT DISTINCT
    ON (team_code, event_code) *
FROM
    transit_stations
ORDER BY
    team_code,
    event_code,
    created_at DESC;

CREATE OR REPLACE VIEW
    bombii_counts
WITH
    (security_invoker = true) AS
SELECT
    event_code,
    team_code,
    COUNT(*) as count
FROM
    bombii_histories
GROUP BY
    event_code,
    team_code
ORDER BY
    team_code;
