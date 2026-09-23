do $$
declare
  target_event_code varchar := 'METRO_V1_TESTPLAY_20261010';
  team_count numeric := 6;
begin
  delete from bombii_histories where event_code = target_event_code;
  delete from goal_stations where event_code = target_event_code;
  delete from points where event_code = target_event_code;
  delete from transit_stations where id in (
    select id from transit_stations
      where event_code = target_event_code
      order by id asc
      offset team_count
  );
end $$;