import { InitRoutemapRequest, InitRoutemapResponse } from "./types";

export interface InitRoutemapService {
    /**
     * 路線図の初期化データを取得する
     * @param {InitRoutemapRequest} req - リクエスト
     * @return {Promise<InitRoutemapResponse>} - レスポンス
     */
    getDataForRoutemap: (req: InitRoutemapRequest) => Promise<InitRoutemapResponse>;
}
