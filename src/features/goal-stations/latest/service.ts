import { LatestGoalStationsService } from "./interface";
import { GetLatestGoalStationsRequest, GetLatestGoalStationsResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";

export const LatestGoalStationsServiceImpl: LatestGoalStationsService = {
    /**
     * イベントコードに紐づく最新目的駅を取得する
     * @param {GetLatestGoalStationsRequest} req - リクエスト
     * @return {Promise<GetLatestGoalStationsResponse>} - レスポンス
     */
    async getLatestGoalStationByEventCode(
        req: GetLatestGoalStationsRequest
    ): Promise<GetLatestGoalStationsResponse> {
        const goalStationsRepository = RepositoryFactory.getGoalStationsRepository();

        try {
            const eventCode = req.eventCode;
            const latestGoalStation = await goalStationsRepository.findNextGoalStation(eventCode);

            if (!latestGoalStation) {
                throw new Error(`No latest goal station found for event code: ${eventCode}`);
            }
            const res: GetLatestGoalStationsResponse = {
                station: latestGoalStation,
            };

            return res;
        } catch (error) {
            console.error("Error in getLatestGoalStationByEventCode:", error);
            throw new Error("Failed to retrieve get latest goal station");
        }
    },
};
