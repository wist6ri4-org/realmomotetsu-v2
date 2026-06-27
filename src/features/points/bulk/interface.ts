import { PostBulkPointsRequest, PostBulkPointsResponse } from "./types";

export interface PointsBulkService {
    /**
     * ポイントをトランザクションで移動する（移動元マイナス・移動先プラスの2件を同時登録）
     * @param {PostBulkPointsRequest} req - リクエスト
     * @return {Promise<PostBulkPointsResponse>} レスポンス
     */
    postBulkPoints: (req: PostBulkPointsRequest) => Promise<PostBulkPointsResponse>;
}
