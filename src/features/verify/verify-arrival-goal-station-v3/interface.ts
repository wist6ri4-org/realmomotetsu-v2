import { PostVerifyArrivalGoalStationV3Request, PostVerifyArrivalGoalStationV3Response } from "./types";

export interface VerifyArrivalGoalStationV3Service {
    /**
     * 処理可否チェック（目的駅到着処理（V3））
     * @param {PostVerifyArrivalGoalStationV3Request} req - リクエスト
     * @return {Promise<PostVerifyArrivalGoalStationV3Response>} レスポンス
     */
    postVerifyArrivalGoalStationV3: (
        req: PostVerifyArrivalGoalStationV3Request,
    ) => Promise<PostVerifyArrivalGoalStationV3Response>;
}
