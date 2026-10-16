import { PostCurrentLocationRequest, PostCurrentLocationResponse } from "./types";

export interface CurrentLocationService {
    /**
     * 現在地とポイントを登録する
     * @param {PostCurrentLocationRequest} req - リクエスト
     * @return {Promise<PostCurrentLocationResponse>} レスポンス
     */
    postCurrentLocation: (req: PostCurrentLocationRequest) => Promise<PostCurrentLocationResponse>;
}
