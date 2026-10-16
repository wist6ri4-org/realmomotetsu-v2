import { AutoCompleteOption } from "@/components/base/CustomAutoComplete";
import { SelectOption } from "@/components/base/CustomSelect";
import { Stations, Teams } from "@/generated/prisma";

export class TypeConverter {
    /**
     * Teamsの配列をSelectOptionの配列に変換する
     * @param {Teams[]} teams - Teamsの配列
     * @return {SelectOption[]} SelectOptionの配列
     */
    static convertTeamsToSelectOptions(teams: Teams[]): SelectOption[] {
        return teams.map((team) => ({
            value: team.teamCode,
            label: team.teamName,
            disabled: false,
        }));
    }

    /**
     * Stationsの配列をSelectOptionの配列に変換する
     * @param {Stations[]} stations - Stationsの配列
     * @return {SelectOption[]} SelectOptionの配列
     */
    static convertStationsToSelectOptions(stations: Stations[]): SelectOption[] {
        return stations.map((station) => ({
            value: station.stationCode,
            label: station.name,
            disabled: false,
        }));
    }

    /**
     * Stationsの配列をAutoCompleteOptionの配列に変換する
     * @param {Stations[]} stations - Stationsの配列
     * @return {AutoCompleteOption[]} AutoCompleteOptionの配列
     */
    static convertStationsToAutoCompleteOptions(stations: Stations[]): AutoCompleteOption[] {
        return stations.map((station) => ({
            value: station.stationCode,
            label: station.name,
            disabled: false,
            searchKeys: [station.name, station.kana, station.englishName],
        }));
    }
}
