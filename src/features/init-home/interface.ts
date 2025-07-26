import { InitHomeRequest, InitHomeResponse } from "./types";

export interface InitHomeService {

    /**
     * ホーム画面の初期化データを取得する
     * @param {InitHomeRequest} req - 初期化リクエスト
     * @return {Promise<InitHomeResponse>} - 初期化レスポンス
     */
    getDataForHome: (req: InitHomeRequest) => Promise<InitHomeResponse>;
}
