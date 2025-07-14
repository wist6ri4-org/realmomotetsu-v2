import {
    GetTransitStationsRequest,
    GetTransitStationsResponse,
    PostTransitStationsRequest,
} from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { TransitStationsWithRelations } from "@/repositories/transitStations/TransitStationsRepository";
import { TransitStationsService } from "./interface";
import { TransitStations } from "@/generated/prisma";

export const TransitStationsServiceImpl: TransitStationsService = {
    /**
     * イベントコードに紐づく経由駅をチームコードごとに取得する
     * @param req - リクエストデータ
     * @return {Promise<TransitStationsGroupedByTeamCode>} チームコードごとの経由駅のリスト
     */
    async getTransitStationsByEventCodeGroupedByTeamCode(
        req: GetTransitStationsRequest
    ): Promise<GetTransitStationsResponse> {
        const transitStationsRepository = RepositoryFactory.getTransitStationsRepository();

        try {
            // 経由駅を取得
            const eventCode = req.eventCode;
            const transitStations = await transitStationsRepository.findByEventCode(eventCode);

            // レスポンスの作成
            const res: GetTransitStationsResponse = {};
            transitStations.map((transitStation: TransitStationsWithRelations) => {
                const teamCode = transitStation.teamCode;
                if (!res[teamCode]) {
                    res[teamCode] = [];
                }
                res[teamCode].push({
                    ...transitStation,
                });
            });
            return res;
        } catch (error) {
            console.error("Error fetching transit stations by event code:", error);
            throw new Error("Failed to fetch transit stations");
        }
    },

    /**
     * 経由駅を登録する
     * @param req - リクエストデータ
     * @return {Promise<void>} 登録完了
     */
    async postTransitStations(req: PostTransitStationsRequest): Promise<TransitStations> {
        // Repositoryのインスタンスを取得
        const transitStationsRepository = RepositoryFactory.getTransitStationsRepository();

        try {
            return await transitStationsRepository.create({
                eventCode: req.eventCode,
                stationCode: req.stationCode,
                teamCode: req.teamCode,
            });
        } catch (error) {
            console.error("Error in postTransitStations:", error);
            throw new Error("Failed to register transit station");
        }
    },
};
