import { PostCurrentLocationV3Request, PostCurrentLocationV3Response } from "./types";

export interface CurrentLocationV3Service {
    /**
     * 現在地を登録する
     * @param {PostCurrentLocationV3Request} req - リクエスト
     * @return {Promise<PostCurrentLocationV3Response>} レスポンス
     */
    postCurrentLocationV3: (req: PostCurrentLocationV3Request) => Promise<PostCurrentLocationV3Response>;
}
