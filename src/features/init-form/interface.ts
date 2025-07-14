import { InitFormRequest, InitFormResponse } from "./types";

export interface InitFormService {

    /**
     * フォーム画面の初期化データを取得する
     * @returns {Promise<InitFormRequest[]>} フォーム画面の初期化
     */
    getDataForForm: (req: InitFormRequest) => Promise<InitFormResponse>;
}