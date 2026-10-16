import { InitRouletteRequest, InitRouletteResponse } from "./types";

export interface InitRouletteService {
    /**
     * ルーレット画面の初期化データを取得する
     * @param {InitRouletteRequest} req - リクエスト
     * @return {Promise<InitRouletteResponse>} レスポンス
     */
    getDataForRoulette: (req: InitRouletteRequest) => Promise<InitRouletteResponse>;
}
