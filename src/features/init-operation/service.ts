import LocationUtils from "@/utils/locationUtils";
import { InitOperationService } from "./interface";
import { InitOperationRequest, InitOperationResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import DijkstraUtils from "@/utils/dijkstraUtils";
import { TeamData } from "@/types/TeamData";

export const InitOperationServiceImpl: InitOperationService = {
    /**
     * オペレーション画面の初期化データを取得する
     * @param req - リクエストデータ
     * @returns {Promise<InitOperationResponse>} オペレーション画面の初期化データ
     */
    async getDataForOperation(req: InitOperationRequest): Promise<InitOperationResponse> {
        const eventsRepository = RepositoryFactory.getEventsRepository();
        const teamsRepository = RepositoryFactory.getTeamsRepository();
        const stationsRepository = RepositoryFactory.getStationsRepository();
        const nearbyStationsRepository = RepositoryFactory.getNearbyStationsRepository();
        const pointsRepository = RepositoryFactory.getPointsRepository();
        const goalStationsRepository = RepositoryFactory.getGoalStationsRepository();


        try {
            // イベント種別の取得
            const events = await eventsRepository.findByEventCodeWithRelations(req.eventCode);
            const eventTypeCode = events?.eventTypeCode || "";

            // レスポンスの作成
            const [teams, stations, nearbyStations, totalPoints, totalScoredPoints, nextGoalStation] = await Promise.all([
                teamsRepository.findByEventCode(req.eventCode),
                stationsRepository.findByEventTypeCode(eventTypeCode),
                nearbyStationsRepository.findByEventTypeCode(eventTypeCode),
                pointsRepository.sumPointsGroupedByTeamCode(req.eventCode),
                pointsRepository.sumScoredPointsGroupedByTeamCode(req.eventCode),
                goalStationsRepository.findNextGoalStation(req.eventCode),
            ]);

            const convertedStationGraph = DijkstraUtils.convertToStationGraph(nearbyStations)
            const teamData: TeamData[] = teams.map((team) => ({
                id: team.id,
                teamCode: team.teamCode,
                teamName: team.teamName,
                teamColor: team.teamColor || "",
                transitStations: team.transitStations,
                remainingStationsNumber: DijkstraUtils.calculateRemainingStationsNumber(
                    convertedStationGraph,
                    team.transitStations.at(-1)?.stationCode || "",
                    nextGoalStation?.stationCode || ""
                ),
                points: totalPoints.find((p) => p.teamCode === team.teamCode)?.totalPoints || 0,
                scoredPoints:
                    totalScoredPoints.find((p) => p.teamCode === team.teamCode)?.totalPoints || 0,
            }));

            const res: InitOperationResponse = {
                teams: teams,
                stations: stations,
                teamData: teamData,
            };

            // 位置情報が提供されている場合、近隣の駅を計算
            if (req.latitude && req.longitude) {
                const closestStations = LocationUtils.calculate(
                    stations,
                    req.latitude,
                    req.longitude
                );
                res.closestStations = closestStations;
            }

            return res;
        } catch (error) {
            console.error("Error in getDataForOperation:", error);
            throw new Error("Failed to retrieve init operation data");
        }
    },
};
