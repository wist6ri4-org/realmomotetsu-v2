import { InitRouletteRequest, InitRouletteResponse } from "./types";

export interface InitRouletteService {

    /**
     * ルーレット画面の初期化データを取得する
     * @returns {Promise<InitRouletteRequest[]>} ルーレット画面の初期化
     */
    getDataForRoulette: (req: InitRouletteRequest) => Promise<InitRouletteResponse>;
}