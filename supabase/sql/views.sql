-- ビューを作成するSQLスクリプト

CREATE VIEW
    latest_transit_stations AS
SELECT DISTINCT
    ON (team_code, event_code) *
FROM
    transit_stations
ORDER BY
    team_code,
    event_code,
    created_at DESC;

CREATE VIEW
    bombii_counts AS
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