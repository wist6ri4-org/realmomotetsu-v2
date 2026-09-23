import { PostArrivalGoalStationV3Request, PostArrivalGoalStationV3Response } from "./types";

export interface ArrivalGoalStationV3Service {
    /**
     * 目的駅到着処理（V3）
     * @param {PostArrivalGoalStationV3Request} req - リクエスト
     * @return {Promise<PostArrivalGoalStationV3Response>} レスポンス
     */
    postArrivalGoalStationV3: (req: PostArrivalGoalStationV3Request) => Promise<PostArrivalGoalStationV3Response>;
}
