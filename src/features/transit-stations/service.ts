import {
    GetTransitStationsRequest,
    GetTransitStationsResponse,
    PostTransitStationsRequest,
    PostTransitStationsResponse,
} from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { TransitStationsWithRelations } from "@/repositories/transitStations/TransitStationsRepository";
import { TransitStationsService } from "./interface";
import { TransitStations } from "@/generated/prisma";

export const TransitStationsServiceImpl: TransitStationsService = {
    /**
     * イベントコードに紐づく経由駅をチームコードごとに取得する
     * @param {GetTransitStationsRequest} req - リクエスト
     * @return {Promise<GetTransitStationsResponse>} レスポンス
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
            const res: GetTransitStationsResponse = { transitStations: {} };
            transitStations.map((transitStation: TransitStationsWithRelations) => {
                const teamCode = transitStation.teamCode;
                if (!res.transitStations[teamCode]) {
                    res.transitStations[teamCode] = [];
                }
                res.transitStations[teamCode].push({
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
     * @param {PostTransitStationsRequest} req - リクエスト
     * @return {Promise<PostTransitStationsResponse>} レスポンス
     */
    async postTransitStations(
        req: PostTransitStationsRequest
    ): Promise<PostTransitStationsResponse> {
        // Repositoryのインスタンスを取得
        const transitStationsRepository = RepositoryFactory.getTransitStationsRepository();

        try {
            const transitStation = await transitStationsRepository.create({
                eventCode: req.eventCode,
                stationCode: req.stationCode,
                teamCode: req.teamCode,
            });
            const res: PostTransitStationsResponse = {
                transitStation: transitStation as TransitStations,
            };
            return res;
        } catch (error) {
            console.error("Error in postTransitStations:", error);
            throw new Error("Failed to register transit station");
        }
    },
};
