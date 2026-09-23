/**
 * @jest-environment node
 */

import { TypeConverter } from "@/utils/typeConverter";
import { buildStation, buildTeam } from "../helpers/factories";

describe("TypeConverter", () => {
    describe("convertTeamsToSelectOptions", () => {
        it("チームコードをvalue、チーム名をlabelに変換する", () => {
            const options = TypeConverter.convertTeamsToSelectOptions([
                buildTeam({ teamCode: "TEAM_A", teamName: "チームA" }),
                buildTeam({ teamCode: "TEAM_B", teamName: "チームB" }),
            ]);

            expect(options).toEqual([
                { value: "TEAM_A", label: "チームA", disabled: false },
                { value: "TEAM_B", label: "チームB", disabled: false },
            ]);
        });

        it("空配列の場合は空配列を返す", () => {
            expect(TypeConverter.convertTeamsToSelectOptions([])).toEqual([]);
        });
    });

    describe("convertStationsToSelectOptions", () => {
        it("駅コードをvalue、駅名をlabelに変換する", () => {
            const options = TypeConverter.convertStationsToSelectOptions([
                buildStation({ stationCode: "STATION_A", name: "駅A" }),
            ]);

            expect(options).toEqual([{ value: "STATION_A", label: "駅A", disabled: false }]);
        });

        it("空配列の場合は空配列を返す", () => {
            expect(TypeConverter.convertStationsToSelectOptions([])).toEqual([]);
        });
    });

    describe("convertStationsToAutoCompleteOptions", () => {
        it("駅名・かな・英語名を検索キーとして保持する", () => {
            const options = TypeConverter.convertStationsToAutoCompleteOptions([
                buildStation({
                    stationCode: "STATION_A",
                    name: "駅A",
                    kana: "えきえー",
                    englishName: "Station A",
                }),
            ]);

            expect(options).toEqual([
                {
                    value: "STATION_A",
                    label: "駅A",
                    disabled: false,
                    searchKeys: ["駅A", "えきえー", "Station A"],
                },
            ]);
        });

        it("空配列の場合は空配列を返す", () => {
            expect(TypeConverter.convertStationsToAutoCompleteOptions([])).toEqual([]);
        });
    });
});
