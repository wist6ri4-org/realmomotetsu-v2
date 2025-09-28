import { GetLatestTransitStationsRequest, GetLatestTransitStationsResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { LatestTransitStationsService } from "./interface";
import { ApiError, InternalServerError } from "@/error";

export const LatestTransitStationsServiceImpl: LatestTransitStationsService = {
    /**
     * イベントコードに紐づく最新経由駅を取得する
     * @param {GetLatestTransitStationsRequest} req - リクエスト
     * @return {Promise<GetLatestTransitStationsResponse>} レスポンス
     */
    async getLatestTransitStationsByEventCode(
        req: GetLatestTransitStationsRequest
    ): Promise<GetLatestTransitStationsResponse> {
        const transitStationsRepository = RepositoryFactory.getTransitStationsRepository();

        try {
            // 最新経由駅を取得
            const eventCode = req.eventCode;
            const latestTransitStations = await transitStationsRepository.findLatestByEventCode(eventCode);

            // レスポンスの作成
            const res: GetLatestTransitStationsResponse = {
                latestTransitStations: latestTransitStations,
            };
            return res;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${arguments.callee.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
