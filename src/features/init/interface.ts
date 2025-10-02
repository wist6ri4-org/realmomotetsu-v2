import { InitRequest, InitResponse } from "./types";

export interface InitService {
    /**
     * フォーム画面の初期化データを取得する
     * @param {InitFormRequest} req - リクエスト
     * @returns {Promise<InitFormRequest[]>} レスポンス
     */
    getDataForInit: (req: InitRequest) => Promise<InitResponse>;
}
