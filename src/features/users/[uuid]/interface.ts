import {
    GetUsersByUuidRequest,
    GetUsersByUuidResponse,
    PutUsersByUuidRequest,
    PutUsersByUuidResponse,
} from "./types";

export interface UsersByUuidService {
    /**
     * ユーザーをUUIDで取得する
     * @param {GetUsersByUuidRequest} req - リクエスト
     * @return {Promise<GetUsersByUuidResponse>} レスポンス
     */
    getUsersByUuid: (req: GetUsersByUuidRequest) => Promise<GetUsersByUuidResponse>;

    /**
     * ユーザーをUUIDで更新する
     * @param {PutUsersByUuidRequest} req - リクエスト
     * @return {Promise<PutUsersByUuidResponse>} レスポンス
     */
    putUsersByUuid: (req: PutUsersByUuidRequest) => Promise<PutUsersByUuidResponse>;
}
