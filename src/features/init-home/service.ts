import { InitHomeService } from "./interface";
import { InitHomeRequest, InitHomeResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { TeamData } from "@/types/TeamData";

export const InitHomeServiceImpl: InitHomeService = {
    /**
     * ホーム画面の初期化データを取得する
     * @param req - リクエストデータ
     * @returns {Promise<InitHomeResponse>} ホーム画面の初期化データ
     */
    async getDataForHome(req: InitHomeRequest): Promise<InitHomeResponse> {
        // Repositoryのインスタンスを取得
        const teamsRepository = RepositoryFactory.getTeamsRepository();
        const goalStationsRepository = RepositoryFactory.getGoalStationsRepository();
        const bombiiHistoriesRepository = RepositoryFactory.getBombiiHistoriesRepository();

        try {
            // 並列でデータを取得
            const [teams, nextGoalStation, currentBombiiHistory] = await Promise.all([
                teamsRepository.findByEventCode(req.eventCode),
                goalStationsRepository.findNextGoalStation(req.eventCode),
                bombiiHistoriesRepository.findCurrentBombiiTeam(req.eventCode),
            ]);

            // TeamsをTeamDataに変換
            const teamData: TeamData[] = teams.map((team) => ({
                id: team.id,
                teamCode: team.teamCode,
                teamName: team.teamName,
                teamColor: team.teamColor || "",
                transitStations: [], // TODO: 実際のtransitStationsデータを取得して設定
                remainingStationsNumber: 0, // TODO: 実際の計算ロジックを実装
                chargedPoints: 0, // TODO: 実際のポイント計算ロジックを実装
                notChargedPoints: 0, // TODO: 実際のポイント計算ロジックを実装
            }));

            // currentBombiiHistoryからbombiiTeamを取得
            let bombiiTeam: TeamData | null = null;
            if (currentBombiiHistory) {
                const team = currentBombiiHistory.team;
                bombiiTeam = {
                    id: team.id,
                    teamCode: team.teamCode,
                    teamName: team.teamName,
                    teamColor: team.teamColor || "",
                    transitStations: [], // TODO: 実際のデータを取得
                    remainingStationsNumber: 0, // TODO: 実際の計算
                    chargedPoints: 0, // TODO: 実際の計算
                    notChargedPoints: 0, // TODO: 実際の計算
                };
            }

            const res: InitHomeResponse = {
                teamData: teamData,
                nextGoalStation: nextGoalStation,
                bombiiTeam: bombiiTeam,
            };

            return res;
        } catch (error) {
            console.error("Error in getDataForHome:", error);
            throw new Error("Failed to retrieve init home data");
        }
    },
};
