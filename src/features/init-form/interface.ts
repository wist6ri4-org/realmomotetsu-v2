import { InitFormRequest, InitFormResponse } from "./types";

export interface InitFormService {
    /**
     * フォーム画面の初期化データを取得する
     * @param {InitFormRequest} req - リクエスト
     * @returns {Promise<InitFormRequest[]>} レスポンス
     */
    getDataForForm: (req: InitFormRequest) => Promise<InitFormResponse>;
}
