import { GetEventByEventCodeRequest, GetEventByEventCodeResponse } from "./types";

export interface EventByEventCodeService {
    /**
     * イベントコードでイベントを取得する
     * @param {GetEventByEventCodeRequest} req - リクエスト
     * @return {Promise<GetEventByEventCodeResponse>} レスポンス
     */
    getEventByEventCode: (req: GetEventByEventCodeRequest) => Promise<GetEventByEventCodeResponse>;
}
