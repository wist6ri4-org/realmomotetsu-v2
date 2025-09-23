import { PostUsersRequest, PostUsersResponse } from "./types";

export interface UsersService {
    /**
     * ユーザーを登録する
     * @param {PostUsersRequest} req - リクエスト
     * @return {Promise<PostUsersResponse>} レスポンス
     */
    postUsers: (req: PostUsersRequest) => Promise<PostUsersResponse>;
}
