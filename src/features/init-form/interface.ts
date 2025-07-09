import { InitFormRequest, InitFormResponse } from "./types";

export interface InitFormService {

    /**
     * ホーム画面の初期化データを取得する
     * @returns {Promise<InitHome[]>} ホーム画面の初期化
     */
    getDataForForm: (req: InitFormRequest) => Promise<InitFormResponse>;
}