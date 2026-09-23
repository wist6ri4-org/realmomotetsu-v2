import { PostBombiiHistoriesRequest, PostBombiiHistoriesResponse } from "./types";

export interface BombiiHistoriesService {
    /**
     * ボンビー履歴を登録する
     * @param {PostBombiiHistoriesRequest} req - リクエスト
     * @return {Promise<PostBombiiHistoriesResponse>} レスポンス
     */
    postBombiiHistories: (req: PostBombiiHistoriesRequest) => Promise<PostBombiiHistoriesResponse>;
}
