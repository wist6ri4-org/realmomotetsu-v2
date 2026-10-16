import {
    GetPointsRequest,
    GetPointsResponse,
    PostPointsRequest,
    PostPointsResponse,
    PutPointsRequest,
    PutPointsResponse,
} from "./types";

export interface PointsService {
    /**
     * イベントコードに紐づくポイントをチームコードごとに取得する
     * @param {GetPointsRequest} req - リクエスト
     * @return {Promise<GetPointsResponse>} レスポンス
     */
    getPointsByEventCodeGroupedByTeamCode: (req: GetPointsRequest) => Promise<GetPointsResponse>;

    /**
     * ポイントを登録する
     * @param {PostPointsRequest} req - リクエスト
     * @return {Promise<PostPointsResponse>} レスポンス
     */
    postPoints: (req: PostPointsRequest) => Promise<PostPointsResponse>;

    /**
     * ポイントのステータスを更新する
     * @param {PutPointsRequest} req - リクエスト
     * @return {Promise<PutPointsResponse>} レスポンス
     */
    putPoints: (req: PutPointsRequest) => Promise<PutPointsResponse>;
}
