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