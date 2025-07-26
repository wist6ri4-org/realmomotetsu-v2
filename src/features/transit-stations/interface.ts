import {
    GetTransitStationsRequest,
    GetTransitStationsResponse,
    PostTransitStationsRequest,
    PostTransitStationsResponse,
} from "./types";

export interface TransitStationsService {
    /**
     * イベントコードに紐づく経由駅をチームコードごとに取得する
     * @param {GetTransitStationsRequest} req - リクエスト
     * @return {Promise<GetTransitStationsResponse>} レスポンス
     */
    getTransitStationsByEventCodeGroupedByTeamCode: (
        req: GetTransitStationsRequest
    ) => Promise<GetTransitStationsResponse>;

    /**
     * 経由駅を登録する
     * @param {PostTransitStationsRequest} req - リクエスト
     * @return {Promise<PostTransitStationsResponse>} レスポンス
     */
    postTransitStations: (req: PostTransitStationsRequest) => Promise<PostTransitStationsResponse>;
}
