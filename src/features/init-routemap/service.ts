import { Teams } from "@/generated/prisma";
import { InitRoutemapService } from "./interface";
import { InitRoutemapRequest, InitRoutemapResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { TeamData } from "@/types/TeamData";
import DijkstraUtils from "@/utils/dijkstraUtils";

export const InitRoutemapServiceImpl: InitRoutemapService = {
    /**
     * 路線図の初期化データを取得する
     * @param {InitRoutemapRequest} req - リクエスト
     * @returns {Promise<InitRoutemapResponse>} レスポンス
     */
    async getDataForRoutemap(req: InitRoutemapRequest): Promise<InitRoutemapResponse> {
        const teamsRepository = RepositoryFactory.getTeamsRepository();
        const goalStationsRepository = RepositoryFactory.getGoalStationsRepository();
        const bombiiHistoriesRepository = RepositoryFactory.getBombiiHistoriesRepository();
        const pointsRepository = RepositoryFactory.getPointsRepository();
        const eventsRepository = RepositoryFactory.getEventsRepository();
        const nearbyStationsRepository = RepositoryFactory.getNearbyStationsRepository();
        const stationsRepository = RepositoryFactory.getStationsRepository();

        try {
            // 並列でデータを取得
            const [teams, nextGoalStation, currentBombiiHistory, totalPoints, totalScoredPoints, events, bombiiCounts] =
                await Promise.all([
                    teamsRepository.findByEventCode(req.eventCode),
                    goalStationsRepository.findNextGoalStation(req.eventCode),
                    bombiiHistoriesRepository.findCurrentBombiiTeam(req.eventCode),
                    pointsRepository.sumPointsGroupedByTeamCode(req.eventCode),
                    pointsRepository.sumScoredPointsGroupedByTeamCode(req.eventCode),
                    eventsRepository.findByEventCode(req.eventCode),
                    bombiiHistoriesRepository.countByEventCodeGroupedByTeamCode(req.eventCode),
                ]);

            // イベント種別コードで並列でデータを取得
            const eventTypeCode = events?.eventTypeCode || "";
            const [stationGraph, stations] = await Promise.all([
                nearbyStationsRepository.findByEventTypeCode(eventTypeCode),
                stationsRepository.findByEventTypeCode(eventTypeCode),
            ]);
            const convertedStationGraph = DijkstraUtils.convertToStationGraph(stationGraph);

            // TeamsをTeamDataに変換
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
                scoredPoints: totalScoredPoints.find((p) => p.teamCode === team.teamCode)?.totalPoints || 0,
                bombiiCounts: bombiiCounts.find((b) => b.teamCode === team.teamCode)?.count || 0,
            }));

            // currentBombiiHistoryからbombiiTeamを取得
            let bombiiTeam: Teams | null = null;
            if (currentBombiiHistory) {
                const team = currentBombiiHistory.team;
                bombiiTeam = {
                    id: team.id,
                    teamCode: team.teamCode,
                    teamName: team.teamName,
                    teamColor: team.teamColor || "",
                    eventCode: team.eventCode,
                    createdAt: team.createdAt,
                    updatedAt: team.updatedAt,
                };
            }

            // レスポンスの作成
            const res: InitRoutemapResponse = {
                teamData: teamData,
                nextGoalStation: nextGoalStation,
                bombiiTeam: bombiiTeam,
                stations: stations,
            };

            return res;
        } catch (error) {
            console.error("Error in getDataForRoutemap:", error);
            throw new Error("Failed to retrieve init routemap data");
        }
    },
};
