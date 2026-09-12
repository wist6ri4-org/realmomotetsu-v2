import { InitHomeRequest, InitHomeResponse } from "./types";

export interface InitHomeService {
    /**
     * ホーム画面の初期化データを取得する
     * @param {InitHomeRequest} req - リクエスト
     * @return {Promise<InitHomeResponse>} - レスポンス
     */
    getDataForHome: (req: InitHomeRequest) => Promise<InitHomeResponse>;
}
