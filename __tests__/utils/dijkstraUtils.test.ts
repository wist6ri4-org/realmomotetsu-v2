/**
 * @jest-environment node
 */

import DijkstraUtils, { StationsGraph } from "@/utils/dijkstraUtils";
import { buildBidirectionalNearbyStations, buildNearbyStation } from "../helpers/factories";

describe("DijkstraUtils", () => {
    describe("convertNearbyStationsToStationGraph", () => {
        it("出発駅をキーにした隣接リストへ変換する", () => {
            const graph = DijkstraUtils.convertNearbyStationsToStationGraph([
                buildNearbyStation("A", "B", 5),
                buildNearbyStation("A", "C", 8),
                buildNearbyStation("B", "C", 3),
            ]);

            expect(graph).toEqual({
                A: [
                    { stationCode: "B", timeMinutes: 5 },
                    { stationCode: "C", timeMinutes: 8 },
                ],
                B: [{ stationCode: "C", timeMinutes: 3 }],
            });
        });

        it("接続情報が空の場合は空のグラフを返す", () => {
            expect(DijkstraUtils.convertNearbyStationsToStationGraph([])).toEqual({});
        });
    });

    describe("calculateRequiredTimeAndStations", () => {
        it("開始駅は時間・駅数ともに0になる", () => {
            const graph = DijkstraUtils.convertNearbyStationsToStationGraph(
                buildBidirectionalNearbyStations([["A", "B", 5]]),
            );

            const distances = DijkstraUtils.calculateRequiredTimeAndStations(graph, "A");

            expect(distances.get("A")).toEqual({ timeMinutes: 0, stationsNumber: 0 });
        });

        it("経由駅を挟んだ駅までの時間と駅数を累積して算出する", () => {
            // A --5分-- B --7分-- C の直線路線
            const graph = DijkstraUtils.convertNearbyStationsToStationGraph(
                buildBidirectionalNearbyStations([
                    ["A", "B", 5],
                    ["B", "C", 7],
                ]),
            );

            const distances = DijkstraUtils.calculateRequiredTimeAndStations(graph, "A");

            expect(distances.get("B")).toEqual({ timeMinutes: 5, stationsNumber: 1 });
            expect(distances.get("C")).toEqual({ timeMinutes: 12, stationsNumber: 2 });
        });

        it("所要時間ではなく駅数が最小の経路を採用する", () => {
            // A --1分-- B --1分-- C（2駅・2分）と A --10分-- C（1駅・10分）が並存する路線
            const graph = DijkstraUtils.convertNearbyStationsToStationGraph(
                buildBidirectionalNearbyStations([
                    ["A", "B", 1],
                    ["B", "C", 1],
                    ["A", "C", 10],
                ]),
            );

            const distances = DijkstraUtils.calculateRequiredTimeAndStations(graph, "A");

            // 最短時間は2分だが、駅数優先のロジックのため1駅・10分の直通経路が採用される
            expect(distances.get("C")).toEqual({ timeMinutes: 10, stationsNumber: 1 });
        });

        it("駅数が同じ経路が複数ある場合は所要時間が短いほうを採用する", () => {
            // A --10分-- B --10分-- D と A --1分-- C --1分-- D（ともに2駅）
            const graph = DijkstraUtils.convertNearbyStationsToStationGraph(
                buildBidirectionalNearbyStations([
                    ["A", "B", 10],
                    ["B", "D", 10],
                    ["A", "C", 1],
                    ["C", "D", 1],
                ]),
            );

            const distances = DijkstraUtils.calculateRequiredTimeAndStations(graph, "A");

            expect(distances.get("D")).toEqual({ timeMinutes: 2, stationsNumber: 2 });
        });

        it("到達できない駅は時間・駅数ともにInfinityのままになる", () => {
            // A<->B と C<->D が分断された路線
            const graph = DijkstraUtils.convertNearbyStationsToStationGraph(
                buildBidirectionalNearbyStations([
                    ["A", "B", 5],
                    ["C", "D", 5],
                ]),
            );

            const distances = DijkstraUtils.calculateRequiredTimeAndStations(graph, "A");

            expect(distances.get("C")).toEqual({ timeMinutes: Infinity, stationsNumber: Infinity });
            expect(distances.get("D")).toEqual({ timeMinutes: Infinity, stationsNumber: Infinity });
        });
    });

    describe("calculateRemainingStationsNumber", () => {
        const graph: StationsGraph = DijkstraUtils.convertNearbyStationsToStationGraph(
            buildBidirectionalNearbyStations([
                ["A", "B", 5],
                ["B", "C", 5],
            ]),
        );

        it("開始駅から目的駅までの駅数を返す", () => {
            expect(DijkstraUtils.calculateRemainingStationsNumber(graph, "A", "C")).toBe(2);
        });

        it("開始駅と目的駅が同じ場合は0を返す", () => {
            expect(DijkstraUtils.calculateRemainingStationsNumber(graph, "A", "A")).toBe(0);
        });

        it("目的駅がグラフに存在しない場合はエラーになる", () => {
            expect(() => DijkstraUtils.calculateRemainingStationsNumber(graph, "A", "UNKNOWN")).toThrow(
                "Station A not found in the graph",
            );
        });
    });
});
