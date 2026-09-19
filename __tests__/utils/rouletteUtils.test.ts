/**
 * @jest-environment node
 */

import { StationType } from "@/generated/prisma";
import DijkstraUtils, { DistancesMap } from "@/utils/dijkstraUtils";
import { RouletteUtils } from "@/utils/rouletteUtils";
import {
    buildBidirectionalNearbyStations,
    buildGoalStation,
    buildLatestTransitStation,
    buildStation,
    buildStations,
} from "../helpers/factories";

/**
 * 距離マップを組み立てる
 * @param {Array<[string, number, number]>} entries - [駅コード, 所要時間, 駅数]の配列
 * @return {DistancesMap} 距離マップ
 */
const buildDistances = (entries: Array<[string, number, number]>): DistancesMap =>
    new Map(entries.map(([code, timeMinutes, stationsNumber]) => [code, { timeMinutes, stationsNumber }]));

describe("RouletteUtils", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getRandomStationCode（ぶっとびルーレット）", () => {
        const stations = buildStations(["A", "B", "C"]);

        it("開始駅を除いた駅から選択する", () => {
            // 何度引いても開始駅は選ばれない
            const selected = new Set(
                Array.from({ length: 50 }, () => RouletteUtils.getRandomStationCode(stations, "A")),
            );

            expect(selected.has("A")).toBe(false);
            expect([...selected].every((code) => ["B", "C"].includes(code))).toBe(true);
        });

        it("乱数値に応じて候補が選ばれる", () => {
            jest.spyOn(Math, "random").mockReturnValue(0);
            expect(RouletteUtils.getRandomStationCode(stations, "A")).toBe("B");

            jest.spyOn(Math, "random").mockReturnValue(0.99);
            expect(RouletteUtils.getRandomStationCode(stations, "A")).toBe("C");
        });

        it("駅が1つもない場合はエラーになる", () => {
            expect(() => RouletteUtils.getRandomStationCode([], "A")).toThrow(
                "No stations available to select from.",
            );
        });
    });

    describe("getCandidateStationDistances（V2の候補駅絞り込み）", () => {
        // A --10分-- B --10分-- C --10分-- D の直線路線
        const graph = DijkstraUtils.convertNearbyStationsToStationGraph(
            buildBidirectionalNearbyStations([
                ["A", "B", 10],
                ["B", "C", 10],
                ["C", "D", 10],
            ]),
        );

        it("開始駅そのものは候補から除外される", () => {
            const candidates = RouletteUtils.getCandidateStationDistances(graph, "A", [], [], 0);

            expect(candidates.has("A")).toBe(false);
        });

        it("所要時間が除外範囲以下の駅は候補から除外される", () => {
            // Bは10分、Cは20分、Dは30分。15分以下を除外するとC・Dのみ残る
            const candidates = RouletteUtils.getCandidateStationDistances(graph, "A", [], [], 15);

            expect([...candidates.keys()].sort()).toEqual(["C", "D"]);
        });

        it("各チームの最新経由駅は候補から除外される", () => {
            const candidates = RouletteUtils.getCandidateStationDistances(
                graph,
                "A",
                [buildLatestTransitStation({ stationCode: "C" })],
                [],
                0,
            );

            expect([...candidates.keys()].sort()).toEqual(["B", "D"]);
        });

        it("既出の目的駅は候補から除外される", () => {
            const candidates = RouletteUtils.getCandidateStationDistances(
                graph,
                "A",
                [],
                [buildGoalStation({ stationCode: "D" })],
                0,
            );

            expect([...candidates.keys()].sort()).toEqual(["B", "C"]);
        });

        it("経由駅・目的駅が空配列の場合はすべての駅が候補になる", () => {
            const candidates = RouletteUtils.getCandidateStationDistances(graph, "A", [], [], 0);

            expect([...candidates.keys()].sort()).toEqual(["B", "C", "D"]);
        });
    });

    describe("calculateProbabilities（V2の確率計算）", () => {
        it("所要時間の逆数で重み付けされ、確率の合計は1になる", () => {
            const probabilities = RouletteUtils.calculateProbabilities(
                buildDistances([
                    ["B", 10, 1],
                    ["C", 20, 2],
                ]),
            );

            // 重みは1/10と1/20なので、2:1の比率になる
            expect(probabilities.get("B")).toBeCloseTo(2 / 3, 10);
            expect(probabilities.get("C")).toBeCloseTo(1 / 3, 10);
            expect([...probabilities.values()].reduce((sum, p) => sum + p, 0)).toBeCloseTo(1, 10);
        });

        it("近い駅ほど選ばれやすくなる", () => {
            const probabilities = RouletteUtils.calculateProbabilities(
                buildDistances([
                    ["NEAR", 5, 1],
                    ["FAR", 50, 5],
                ]),
            );

            expect(probabilities.get("NEAR")!).toBeGreaterThan(probabilities.get("FAR")!);
        });

        it("到達できない駅の確率は0になる", () => {
            const probabilities = RouletteUtils.calculateProbabilities(
                buildDistances([
                    ["B", 10, 1],
                    ["UNREACHABLE", Infinity, Infinity],
                ]),
            );

            expect(probabilities.get("UNREACHABLE")).toBe(0);
            expect(probabilities.get("B")).toBe(1);
        });
    });

    describe("getCandidateStationDistancesV3（V3の候補駅絞り込み）", () => {
        // A --10分-- B --10分-- C --10分-- D の直線路線
        const graph = DijkstraUtils.convertNearbyStationsToStationGraph(
            buildBidirectionalNearbyStations([
                ["A", "B", 10],
                ["B", "C", 10],
                ["C", "D", 10],
            ]),
        );
        const stations = [
            buildStation({ id: 1, stationCode: "A", stationType: StationType.mission }),
            buildStation({ id: 2, stationCode: "B", stationType: StationType.mission }),
            buildStation({ id: 3, stationCode: "C", stationType: StationType.plus }),
            buildStation({ id: 4, stationCode: "D", stationType: StationType.mission }),
        ];

        it("ミッション駅以外は候補から除外される", () => {
            const candidates = RouletteUtils.getCandidateStationDistancesV3(stations, graph, "A");

            // Cはプラス駅のため除外される
            expect([...candidates.keys()].sort()).toEqual(["B", "D"]);
        });

        it("開始駅そのものは候補から除外される", () => {
            const candidates = RouletteUtils.getCandidateStationDistancesV3(stations, graph, "B");

            expect(candidates.has("B")).toBe(false);
        });

        it("V2と異なり所要時間による除外は行わない", () => {
            // Bは開始駅Aから10分しか離れていないが、V3では候補に残る
            const candidates = RouletteUtils.getCandidateStationDistancesV3(stations, graph, "A");

            expect(candidates.has("B")).toBe(true);
        });

        it("最新経由駅と既出目的駅は候補から除外される", () => {
            const candidates = RouletteUtils.getCandidateStationDistancesV3(
                stations,
                graph,
                "A",
                [buildLatestTransitStation({ stationCode: "B" })],
                [buildGoalStation({ stationCode: "D" })],
            );

            expect([...candidates.keys()]).toEqual([]);
        });
    });

    describe("calculateProbabilitiesV3（V3の確率計算）", () => {
        it("候補が少ない場合は7駅以上離れた駅を均等な確率で選ぶ", () => {
            const distances = buildDistances([
                ["NEAR", 10, 3],
                ["FAR_1", 40, 8],
                ["FAR_2", 50, 10],
            ]);

            const probabilities = RouletteUtils.calculateProbabilitiesV3(distances);

            // 7駅未満のNEARは対象外となり、残り2駅が均等割りになる
            expect([...probabilities.keys()].sort()).toEqual(["FAR_1", "FAR_2"]);
            expect(probabilities.get("FAR_1")).toBe(0.5);
            expect(probabilities.get("FAR_2")).toBe(0.5);
        });

        it("候補が十分にある場合は選出された駅が均等な確率になる", () => {
            // 所要時間の異なる20駅（すべて7駅以上離れている）を用意する
            const distances = buildDistances(
                Array.from({ length: 20 }, (_, index): [string, number, number] => [
                    `STATION_${index}`,
                    (index + 1) * 10,
                    index + 7,
                ]),
            );

            const probabilities = RouletteUtils.calculateProbabilitiesV3(distances);

            const values = [...probabilities.values()];
            expect(values.length).toBeGreaterThan(0);
            // 全駅が同じ確率であること
            expect(new Set(values).size).toBe(1);
            expect(values.reduce((sum, p) => sum + p, 0)).toBeCloseTo(1, 10);
        });

        it("候補が1つもない場合は空のマップを返す", () => {
            expect(RouletteUtils.calculateProbabilitiesV3(new Map()).size).toBe(0);
        });
    });

    describe("selectNextStationCode", () => {
        it("累積確率に基づいて駅を選択する", () => {
            const probabilities = new Map([
                ["A", 0.6],
                ["B", 0.4],
            ]);

            jest.spyOn(Math, "random").mockReturnValue(0.5);
            expect(RouletteUtils.selectNextStationCode(probabilities)).toBe("A");

            jest.spyOn(Math, "random").mockReturnValue(0.7);
            expect(RouletteUtils.selectNextStationCode(probabilities)).toBe("B");
        });

        it("確率0の駅は選ばれない", () => {
            const probabilities = new Map([
                ["ZERO", 0],
                ["ONE", 1],
            ]);

            jest.spyOn(Math, "random").mockReturnValue(0);
            expect(RouletteUtils.selectNextStationCode(probabilities)).toBe("ONE");
        });

        it("確率の合計が1に満たない場合は最後の駅にフォールバックする", () => {
            const probabilities = new Map([
                ["A", 0.1],
                ["B", 0.1],
            ]);

            jest.spyOn(Math, "random").mockReturnValue(0.99);
            expect(RouletteUtils.selectNextStationCode(probabilities)).toBe("B");
        });

        it("候補が1つもない場合はエラーになる", () => {
            expect(() => RouletteUtils.selectNextStationCode(new Map())).toThrow(
                "No stations available for selection",
            );
        });
    });

    describe("getWeightedStationCodeV3（V3の目的駅ルーレット）", () => {
        it("ミッション駅かつ絞り込み条件を満たす駅のみが選ばれる", () => {
            // A から順に10分ずつ離れた10駅の直線路線
            const stationCodes = Array.from({ length: 10 }, (_, index) => `S${index}`);
            const nearbyStations = buildBidirectionalNearbyStations(
                stationCodes
                    .slice(0, -1)
                    .map((code, index): [string, string, number] => [code, stationCodes[index + 1], 10]),
            );
            // S1・S2はプラス駅（＝ミッション駅ではない）とし、候補から外れることを確認する
            const stations = stationCodes.map((stationCode, index) =>
                buildStation({
                    id: index + 1,
                    stationCode,
                    stationType: index === 1 || index === 2 ? StationType.plus : StationType.mission,
                }),
            );

            const selected = new Set(
                Array.from({ length: 50 }, () =>
                    RouletteUtils.getWeightedStationCodeV3(stations, nearbyStations, [], [], "S0"),
                ),
            );

            expect(selected.has("S0")).toBe(false);
            expect(selected.has("S1")).toBe(false);
            expect(selected.has("S2")).toBe(false);
            expect(selected.size).toBeGreaterThan(0);
        });
    });
});
