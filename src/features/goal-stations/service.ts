import { GoalStationsService } from "./interface";
import {
    GetGoalStationsRequest,
    GetGoalStationsResponse,
    PostGoalStationsRequest,
    PostGoalStationsResponse,
} from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";

export const GoalStationsServiceImpl: GoalStationsService = {
    /**
     * イベントコードに紐づく目的駅を全件取得する
     * @param {GetGoalStationsRequest} req - リクエスト
     * @return {Promise<GetGoalStationsResponse>} レスポンス
     */
    async getGoalStationsByEventCode(
        req: GetGoalStationsRequest
    ): Promise<GetGoalStationsResponse> {
        const goalStationsRepository = RepositoryFactory.getGoalStationsRepository();

        try {
            const eventCode = req.eventCode;
            const goalStations = await goalStationsRepository.findByEventCode(eventCode);
            const res: GetGoalStationsResponse = {
                goalStations: goalStations,
            };

            return res;
        } catch (error) {
            console.error("Error in getGoalStationsByEventCode:", error);
            throw new Error("Failed to retrieve get goal stations");
        }
    },

    /**
     * 目的駅を登録する
     * @param {PostGoalStationsRequest} req - リクエスト
     * @return {Promise<PostGoalStationsResponse>} レスポンス
     */
    async postGoalStations(req: PostGoalStationsRequest): Promise<PostGoalStationsResponse> {
        const goalStationsRepository = RepositoryFactory.getGoalStationsRepository();

        try {
            const goalStation = await goalStationsRepository.create({
                eventCode: req.eventCode,
                stationCode: req.stationCode,
            });
            const res: PostGoalStationsResponse = {
                goalStation: goalStation,
            };
            return res;
        } catch (error) {
            console.error("Error in postGoalStations:", error);
            throw new Error("Failed to register goal station");
        }
    },
};
