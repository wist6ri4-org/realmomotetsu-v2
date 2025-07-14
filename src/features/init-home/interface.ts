import { InitHomeRequest, InitHomeResponse } from "./types";

export interface InitHomeService {

    /**
     * ホーム画面の初期化データを取得する
     * @returns {Promise<InitHomeRequest[]>} ホーム画面の初期化
     */
    getDataForHome: (req: InitHomeRequest) => Promise<InitHomeResponse>;
}
