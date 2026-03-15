import { GoalStations, LatestTransitStations, Stations } from "@/generated/prisma";
import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";
import DijkstraUtils from "./dijkstraUtils";
import { GameConstants } from "@/constants/gameConstants";

export class RouletteUtils {
    /**
     * 指定された駅を除くランダムな駅コードを取得
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
     * 指定された駅からの候補駅の出現確率を計算する
     * @param graph - グラフ形式の駅接続情報
     * @param startStationCode - 開始駅のコード
     * @param latestTransitStations - 最新の経由駅情報
     * @param goalStations - 既出目的駅のリスト
     * @param eliminationTimeRangeMinutes - 選択肢から除外する時間範囲（分）
     * @return {Map<string, number>} 各駅の出現確率
     */
    static getCandidateProbabilities(
        graph: Record<string, Array<{ stationCode: string; timeMinutes: number }>>,
        startStationCode: string,
        latestTransitStations: LatestTransitStations[] = [],
        goalStations: GoalStations[] = [],
        eliminationTimeRangeMinutes: number = GameConstants.ELIMINATION_TIME_RANGE_MINUTES,
    ): Map<string, number> {
        const times = DijkstraUtils.calculateRequiredTimeAndStations(graph, startStationCode);

        // 候補駅のフィルタリング
        const filteredTimes = new Map(
            [...times].filter(([key, { timeMinutes }]) => {
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

        return DijkstraUtils.calculateProbabilities(filteredTimes);
    }

    /**
     * 指定された駅からの最短経路を計算し、次の駅を選択する
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
        const graph = DijkstraUtils.convertToStationGraph(nearbyStations);
        const probabilities = RouletteUtils.getCandidateProbabilities(
            graph,
            startStationCode,
            latestTransitStations,
            goalStations,
            eliminationTimeRangeMinutes,
        );

        return DijkstraUtils.selectNextStationCode(probabilities);
    }
}
