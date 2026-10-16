-- AddForeignKey
ALTER TABLE "transit_stations" ADD CONSTRAINT "transit_stations_team_code_fkey" FOREIGN KEY ("team_code") REFERENCES "teams"("team_code") ON DELETE RESTRICT ON UPDATE CASCADE;
