import { GoalStations, LatestTransitStations, Stations } from "@/generated/prisma";
import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";
import DijkstraUtils, { DistancesMap } from "./dijkstraUtils";
import { StationsGraph, StationsProbabilitiesMap } from "./dijkstraUtils";
import { GameConstants } from "@/constants/gameConstants";

export class RouletteUtils {
    /**
     * 開始駅を除くランダムな駅コードを取得
     * @param stations - 近隣駅の接続情報
     * @param startStationCode - 開始駅のコード
     * @return {string} 次に選択する駅のコード
     */
    static getRandomStationCode(stations: Stations[], startStationCode: string): string {
        if (stations.length === 0) {
            throw new Error("No stations available to select from.");
        }
        const filteredStations = stations.filter((station) => station.stationCode !== startStationCode);
        const randomIndex = Math.floor(Math.random() * filteredStations.length);
        return filteredStations[randomIndex].stationCode;
    }

    /**
     * 指定された駅からの最短経路の計算を本に、重み付けをした状態で次の駅を選択する
     * @param nearbyStations - 近隣駅の接続情報
     * @param latestTransitStations - 最新の経由駅情報
     * @param goalStations - 既出目的駅のリスト
     * @param startStationCode - 開始駅のコード
     * @param eliminationTimeRangeMinutes - 選択肢から除外する時間範囲（分）
     * @return {string} 次に選択する駅のコード
     */
    static getWeightedStationCode(
        nearbyStations: NearbyStationsWithRelations[],
        latestTransitStations: LatestTransitStations[] = [],
        goalStations: GoalStations[] = [],
        startStationCode: string,
        eliminationTimeRangeMinutes: number = GameConstants.ELIMINATION_TIME_RANGE_MINUTES,
    ): string {
        const graph: StationsGraph = DijkstraUtils.convertNearbyStationsToStationGraph(nearbyStations);
        const distances: DistancesMap = this.getCandidateStationDistances(
            graph,
            startStationCode,
            latestTransitStations,
            goalStations,
            eliminationTimeRangeMinutes,
        );
        const probabilities: StationsProbabilitiesMap = DijkstraUtils.calculateProbabilities(distances);

        return this.selectNextStationCode(probabilities);
    }

    /**
     * 候補駅を絞り込む
     * @param graph - グラフ形式の駅接続情報
     * @param startStationCode - 開始駅のコード
     * @param latestTransitStations - 最新の経由駅情報
     * @param goalStations - 既出目的駅のリスト
     * @param eliminationTimeRangeMinutes - 選択肢から除外する時間範囲（分）
     * @return {DistancesMap} 絞り込み済みの候補駅のコードとその駅までの時間と駅数を含むマップ
     */
    static getCandidateStationDistances(
        graph: StationsGraph,
        startStationCode: string,
        latestTransitStations: LatestTransitStations[] = [],
        goalStations: GoalStations[] = [],
        eliminationTimeRangeMinutes: number = GameConstants.ELIMINATION_TIME_RANGE_MINUTES,
    ): DistancesMap {
        const distances: DistancesMap = DijkstraUtils.calculateRequiredTimeAndStations(graph, startStationCode);

        // 候補駅のフィルタリング
        const filteredDistances: DistancesMap = new Map(
            [...distances].filter(([key, { timeMinutes }]) => {
                return (
                    // 開始駅と同じ駅は除外
                    key !== startStationCode &&
                    // 時間が範囲外であること
                    timeMinutes > eliminationTimeRangeMinutes &&
                    // 各チームの最新経由駅に含まれないこと（空配列の場合はすべて選択可能）
                    (latestTransitStations.length === 0 ||
                        !latestTransitStations.some((station) => station.stationCode === key)) &&
                    // 既出目的地駅に含まれないこと（空配列の場合はすべて選択可能）
                    (goalStations.length === 0 || !goalStations.some((station) => station.stationCode === key))
                );
            }),
        );
        return filteredDistances;
    }

    /**
     * 確率に基づいて次の駅コードを選択する
     * @param stationsProbabilities - 駅ごとの確率を含むマップ
     * @returns {string} 選択された駅のコード
     */
    static selectNextStationCode(stationsProbabilities: StationsProbabilitiesMap): string {
        // ランダムな値を生成
        const randomValue = Math.random();
        // 確率の累積値を計算
        let cumulative = 0;

        // 累積確率から駅をランダムに選択
        for (const [stationCode, probability] of stationsProbabilities) {
            cumulative += probability;
            if (randomValue < cumulative) {
                return stationCode;
            }
        }

        // 確率の合計が1を超える場合、最後の駅を返す
        const lastStationCode = Array.from(stationsProbabilities.keys()).pop();
        if (lastStationCode) {
            return lastStationCode;
        } else {
            throw new Error("No stations available for selection");
        }
    }
}
