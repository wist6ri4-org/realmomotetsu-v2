import { GetLatestTransitStationsRequest, GetLatestTransitStationsResponse } from "./types";

export interface LatestTransitStationsService {
    /**
     * イベントコードに紐づく最新経由駅を取得する
     * @param {GetLatestTransitStationsRequest} req - リクエスト
     * @return {Promise<GetLatestTransitStationsResponse>} レスポンス
     */
    getLatestTransitStationsByEventCode: (
        req: GetLatestTransitStationsRequest
    ) => Promise<GetLatestTransitStationsResponse>;
}
