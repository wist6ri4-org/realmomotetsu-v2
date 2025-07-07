import { InitHomeRequest, InitHomeResponse } from "./types";

export interface InitHomeService {

    /**
     * ホーム画面の初期化データを取得する
     * @returns {Promise<InitHome[]>} ホーム画面の初期化
     */
    getDataForHome: (req: InitHomeRequest) => Promise<InitHomeResponse>;
}
