import { InitOperationRequest, InitOperationResponse } from "./types";

export interface InitOperationService {
    /**
     * オペレーション画面の初期化データを取得する
     * @param {InitOperationRequest} req - リクエスト
     * @return {Promise<InitOperationResponse>} レスポンス
     */
    getDataForOperation: (req: InitOperationRequest) => Promise<InitOperationResponse>;
}
