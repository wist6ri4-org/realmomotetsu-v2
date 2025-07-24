import { LatestTransitStations, Stations } from "@/generated/prisma";
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
        const filteredStations = stations.filter(
            (station) => station.stationCode !== startStationCode
        );
        const randomIndex = Math.floor(Math.random() * filteredStations.length);
        return filteredStations[randomIndex].stationCode;
    }

    /**
     * 指定された駅からの最短経路を計算し、次の駅を選択する
     * @param nearbyStations - 近隣駅の接続情報
     * @param latestTransitStations - 最新の経由駅情報
     * @param startStationCode - 開始駅のコード
     * @return {string} 次に選択する駅のコード
     */
    static getWeightedStationCode(
        nearbyStations: NearbyStationsWithRelations[],
        latestTransitStations: LatestTransitStations[],
        startStationCode: string
    ): string {
        const graph = DijkstraUtils.convertToStationGraph(nearbyStations);
        const times = DijkstraUtils.calculateRequiredTimeAndStations(graph, startStationCode);

        // 候補駅のフィルタリング
        const filteredTimes = new Map(
            [...times].filter(([key, { timeMinutes }]) => {
                return (
                    // 時間が範囲外であること
                    timeMinutes >= GameConstants.ELIMINATION_TIME_RANGE_MINUTES &&
                    // 各チームの最新経由駅に含まれないこと
                    latestTransitStations.some((station) => station.stationCode !== key)
                );
            })
        );

        const probabilities = DijkstraUtils.calculateProbabilities(filteredTimes);
        const nextStationCode = DijkstraUtils.selectNextStationCode(probabilities);

        return nextStationCode;
    }
}
