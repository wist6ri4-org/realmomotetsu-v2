import {
    GetGoalStationsRequest,
    GetGoalStationsResponse,
    PostGoalStationsRequest,
    PostGoalStationsResponse,
} from "./types";

export interface GoalStationsService {
    /**
     * イベントコードに紐づく目的駅を全件取得する
     * @param req - リクエストデータ
     * @return {Promise<GetGoalStationsResponse>} 目的駅のリスト
     */
    getGoalStationsByEventCode: (req: GetGoalStationsRequest) => Promise<GetGoalStationsResponse>;

    /**
     * 目的駅を登録する
     * @param {PostGoalStationsRequest} req - リクエスト
     * @return {Promise<PostGoalStationsResponse>} レスポンス
     */
    postGoalStations: (req: PostGoalStationsRequest) => Promise<PostGoalStationsResponse>;
}
