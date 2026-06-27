import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";
import { TeamData } from "@/types/TeamData";
import DijkstraUtils from "./dijkstraUtils";
import { GameConstants } from "@/constants/gameConstants";

export class GameLogicUtils {
    /**
     * ボンビーを決める
     * @param {TeamData[]} teamData - チームデータの配列
     * @returns {TeamData} ボンビーを持つチームデータ
     */
    static confirmBombii(teamData: TeamData[]): TeamData {
        const candidateTeams: TeamData[] = teamData.reduce((candidates: TeamData[], team: TeamData) => {
            if (candidates.length === 0) {
                return [team];
            }

            const cr = candidates[0].remainingStationsNumber;
            const ir = team.remainingStationsNumber;
            const cc = candidates[0].scoredPoints;
            const ic = team.scoredPoints;

            // 目的駅から遠いほうがボンビー
            if (cr > ir) {
                return candidates;
            } else if (cr < ir) {
                return [team];
            } else {
                // 目的からの距離が同じ場合、総資産が多いほうがボンビー
                if (cc > ic) {
                    return candidates;
                } else if (cc < ic) {
                    return [team];
                } else {
                    // 総資産も同じ場合両方を返す
                    return [...candidates, team];
                }
            }
        }, []);

        const bombiiTeam = candidateTeams[Math.floor(Math.random() * candidateTeams.length)];
        return bombiiTeam;
    }

    /**
     * 到着ポイントを計算する(V3)
     * @param {NearbyStationsWithRelations[]} nearbyStations - 近隣駅の接続情報
     * @param {string} fromStationCode - 出発駅のコード
     * @param {string} toStationCode - 到着駅のコード
     * @returns {number} 到着ポイント
     */
    static calculateArrivalPrizeV3(
        nearbyStations: NearbyStationsWithRelations[],
        fromStationCode: string,
        toStationCode: string,
    ): number {
        const stationGraph = DijkstraUtils.convertNearbyStationsToStationGraph(nearbyStations);
        const remainingStationsNumber = DijkstraUtils.calculateRemainingStationsNumber(
            stationGraph,
            fromStationCode,
            toStationCode,
        );
        const prize =
            GameConstants.ARRIVAL_PRIZE_V3.BASIC_PRIZE +
            remainingStationsNumber * GameConstants.ARRIVAL_PRIZE_V3.INCREMENT_PER_STATION_NUMBER;
        return prize;
    }

    /**
     * 連続ゴールボーナスを計算する(V3)
     * @param {number} consecutiveGoalCount - 連続ゴール数
     * @returns {number} 連続ゴールボーナス
     */
    static calculateConsecutiveGoalBonusV3(consecutiveGoalCount: number): number {
        return consecutiveGoalCount === 0
            ? 0
            : GameConstants.CONSECUTIVE_GOAL_BONUS_PER_STATION_NUMBER * (consecutiveGoalCount + 1);
    }
}
