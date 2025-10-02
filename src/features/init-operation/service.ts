import { InitOperationService } from "./interface";
import { InitOperationRequest, InitOperationResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import DijkstraUtils from "@/utils/dijkstraUtils";
import { TeamData } from "@/types/TeamData";
import { ApiError, InternalServerError } from "@/error";

export const InitOperationServiceImpl: InitOperationService = {
    /**
     * オペレーション画面の初期化データを取得する
     * @param {InitOperationRequest} req - リクエスト
     * @returns {Promise<InitOperationResponse>} レスポンス
     */
    async getDataForOperation(req: InitOperationRequest): Promise<InitOperationResponse> {
        const eventsRepository = RepositoryFactory.getEventsRepository();
        const teamsRepository = RepositoryFactory.getTeamsRepository();
        const nearbyStationsRepository = RepositoryFactory.getNearbyStationsRepository();
        const pointsRepository = RepositoryFactory.getPointsRepository();
        const goalStationsRepository = RepositoryFactory.getGoalStationsRepository();
        const bombiiHistoriesRepository = RepositoryFactory.getBombiiHistoriesRepository();

        try {
            // イベント種別の取得
            const events = await eventsRepository.findByEventCodeWithRelations(req.eventCode);
            const eventTypeCode = events?.eventTypeCode || "";

            // レスポンスの作成
            const [teams, nearbyStations, totalPoints, totalScoredPoints, nextGoalStation, bombiiCounts] =
                await Promise.all([
                    teamsRepository.findByEventCode(req.eventCode),
                    nearbyStationsRepository.findByEventTypeCode(eventTypeCode),
                    pointsRepository.sumPointsGroupedByTeamCode(req.eventCode),
                    pointsRepository.sumScoredPointsGroupedByTeamCode(req.eventCode),
                    goalStationsRepository.findNextGoalStation(req.eventCode),
                    bombiiHistoriesRepository.countByEventCodeGroupedByTeamCode(req.eventCode),
                ]);

            const convertedStationGraph = DijkstraUtils.convertToStationGraph(nearbyStations);
            const teamData: TeamData[] = teams.map((team) => ({
                id: team.id,
                teamCode: team.teamCode,
                teamName: team.teamName,
                teamColor: team.teamColor || "",
                transitStations: team.transitStations,
                remainingStationsNumber: DijkstraUtils.calculateRemainingStationsNumber(
                    convertedStationGraph,
                    team.transitStations.at(0)?.stationCode || "",
                    nextGoalStation?.stationCode || ""
                ),
                points: totalPoints.find((p) => p.teamCode === team.teamCode)?.totalPoints || 0,
                scoredPoints: totalScoredPoints.find((p) => p.teamCode === team.teamCode)?.totalPoints || 0,
                bombiiCounts: bombiiCounts.find((b) => b.teamCode === team.teamCode)?.count || 0,
            }));

            const res: InitOperationResponse = {
                teamData: teamData,
            };

            return res;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${this.getDataForOperation.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
