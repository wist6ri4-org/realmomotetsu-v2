import { GetUsersByUuidRequest, GetUsersByUuidResponse } from "./types";

export interface UsersByUuidService {
    /**
     * ユーザーをUUIDで取得する
     * @param {GetUsersByUuidRequest} req - リクエスト
     * @return {Promise<GetUsersByUuidResponse>} レスポンス
     */
    getUsersByUuid: (req: GetUsersByUuidRequest) => Promise<GetUsersByUuidResponse>;
}
