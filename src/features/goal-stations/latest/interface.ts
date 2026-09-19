import {
    GetLatestGoalStationsRequest,
    GetLatestGoalStationsResponse,
} from "./types";

export interface LatestGoalStationsService {
    /**
     * イベントコードに紐づく最新目的駅を取得する
     * @param {GetLatestGoalStationsRequest} req - リクエスト
     * @return {Promise<GetLatestGoalStationsResponse>} - レスポンス
     */
    getLatestGoalStationByEventCode: (req: GetLatestGoalStationsRequest) => Promise<GetLatestGoalStationsResponse>;

}
