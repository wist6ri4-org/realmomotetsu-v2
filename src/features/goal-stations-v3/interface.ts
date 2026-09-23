import { PostGoalStationsV3Request, PostGoalStationsV3Response } from "./types";

export interface GoalStationsServiceV3 {
    /**
     * 目的駅を登録する
     * @param {PostGoalStationsV3Request} req - リクエスト
     * @return {Promise<PostGoalStationsV3Response>} レスポンス
     */
    postGoalStationsV3: (req: PostGoalStationsV3Request) => Promise<PostGoalStationsV3Response>;
}
