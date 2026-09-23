import { ApiError, InternalServerError } from "@/error";
import { GoalStationsServiceV3 } from "./interface";
import { PostGoalStationsV3Request, PostGoalStationsV3Response } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { notifyEventDataChanged } from "@/lib/realtimeNotifier";

export const GoalStationsServiceV3Impl: GoalStationsServiceV3 = {
    /**
     * 目的駅を登録する（V3）
     * @param {PostGoalStationsV3Request} req - リクエスト
     * @return {Promise<PostGoalStationsV3Response>} レスポンス
     */
    async postGoalStationsV3(req: PostGoalStationsV3Request): Promise<PostGoalStationsV3Response> {
        const goalStationsRepository = RepositoryFactory.getGoalStationsRepository();

        try {
            const goalStation = await goalStationsRepository.createV3({
                eventCode: req.eventCode,
                stationCode: req.stationCode,
            });
            const res: PostGoalStationsV3Response = {
                goalStation: goalStation,
            };

            await notifyEventDataChanged(req.eventCode);

            return res;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${this.postGoalStationsV3.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
