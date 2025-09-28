import { ApiError, InternalServerError } from "@/error";
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
    async getGoalStationsByEventCode(req: GetGoalStationsRequest): Promise<GetGoalStationsResponse> {
        const goalStationsRepository = RepositoryFactory.getGoalStationsRepository();

        try {
            const eventCode = req.eventCode;
            const goalStations = await goalStationsRepository.findByEventCode(eventCode);
            const res: GetGoalStationsResponse = {
                goalStations: goalStations,
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
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${arguments.callee.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
