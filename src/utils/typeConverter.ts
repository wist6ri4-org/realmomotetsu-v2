import { SelectOption } from "@/components/base/CustomSelect";
import { Stations, Teams } from "@/generated/prisma";

export class TypeConverter {
    static convertTeamsToSelectOptions(teams: Teams[]): SelectOption[] {
        return teams.map((team) => ({
            value: team.teamCode,
            label: team.teamName,
            disabled: false,
        }));
    }

    static convertStationsToSelectOptions(stations: Stations[]): SelectOption[] {
        return stations.map((station) => ({
            value: station.stationCode,
            label: station.name,
            disabled: false,
        }));
    }
}