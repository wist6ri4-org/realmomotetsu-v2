import { ApiError, InternalServerError, ResourceNotFoundError } from "@/error";
import { LatestGoalStationsService } from "./interface";
import { GetLatestGoalStationsRequest, GetLatestGoalStationsResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";

export const LatestGoalStationsServiceImpl: LatestGoalStationsService = {
    /**
     * イベントコードに紐づく最新目的駅を取得する
     * @param {GetLatestGoalStationsRequest} req - リクエスト
     * @return {Promise<GetLatestGoalStationsResponse>} - レスポンス
     */
    async getLatestGoalStationByEventCode(req: GetLatestGoalStationsRequest): Promise<GetLatestGoalStationsResponse> {
        const goalStationsRepository = RepositoryFactory.getGoalStationsRepository();

        try {
            const eventCode = req.eventCode;
            const latestGoalStation = await goalStationsRepository.findNextGoalStation(eventCode);

            if (!latestGoalStation) {
                throw new ResourceNotFoundError("latest_goal_station", eventCode);
            }
            const res: GetLatestGoalStationsResponse = {
                goalStation: latestGoalStation,
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
