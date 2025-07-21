import {
    GetLatestTransitStationsRequest,
    GetLatestTransitStationsResponse,
} from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { LatestTransitStationsService } from "./interface";

export const LatestTransitStationsServiceImpl: LatestTransitStationsService = {
    /**
     * イベントコードに紐づく最新経由駅を取得する
     * @param req - リクエストデータ
     * @return {Promise<LatestTransitStations[]>} 最新経由駅のリスト
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
            const res: GetLatestTransitStationsResponse = latestTransitStations;
            return res;
        } catch (error) {
            console.error("Error fetching transit stations by event code:", error);
            throw new Error("Failed to fetch transit stations");
        }
    },
};
