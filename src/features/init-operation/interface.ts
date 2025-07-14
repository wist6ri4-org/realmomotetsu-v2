import { InitOperationRequest, InitOperationResponse } from "./types";

export interface InitOperationService {

    /**
     * オペレーション画面の初期化データを取得する
     * @returns {Promise<InitOperation[]>} オペレーション画面の初期化
     */
    getDataForOperation: (req: InitOperationRequest) => Promise<InitOperationResponse>;
}
