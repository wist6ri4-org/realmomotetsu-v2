import { ApiError, InternalServerError } from "@/error";
import { InitRouletteService } from "./interface";
import { InitRouletteRequest, InitRouletteResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";

export const InitRouletteServiceImpl: InitRouletteService = {
    /**
     * ルーレット画面の初期化データを取得する
     * @param {InitRouletteRequest} req - リクエスト
     * @return {Promise<InitRouletteResponse>} レスポンス
     */
    async getDataForRoulette(req: InitRouletteRequest): Promise<InitRouletteResponse> {
        const transitStationsRepository = RepositoryFactory.getTransitStationsRepository();

        try {
            // レスポンスの作成
            const [latestTransitStations] = await Promise.all([
                transitStationsRepository.findLatestByEventCode(req.eventCode),
            ]);
            const res: InitRouletteResponse = {
                latestTransitStations: latestTransitStations,
            };

            return res;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${this.getDataForRoulette.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
