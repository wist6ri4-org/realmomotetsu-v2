import LocationUtils from "@/utils/locationUtils";
import { InitRouletteService } from "./interface";
import { InitRouletteRequest, InitRouletteResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";

export const InitRouletteServiceImpl: InitRouletteService = {
    /**
     * ルーレット画面の初期化データを取得する
     * @param req - リクエストデータ
     * @returns {Promise<InitRouletteResponse>} ルーレット画面の初期化データ
     */
    async getDataForRoulette(req: InitRouletteRequest): Promise<InitRouletteResponse> {
        const eventsRepository = RepositoryFactory.getEventsRepository();
        const teamsRepository = RepositoryFactory.getTeamsRepository();
        const stationsRepository = RepositoryFactory.getStationsRepository();

        try {
            // イベント種別の取得
            const events = await eventsRepository.findByEventCodeWithRelations(req.eventCode);
            const eventTypeCode = events?.eventTypeCode || "";

            // レスポンスの作成
            const [teams, stations] = await Promise.all([
                teamsRepository.findByEventCode(req.eventCode),
                stationsRepository.findByEventTypeCode(eventTypeCode),
            ]);
            const res: InitRouletteResponse = {
                teams: teams,
                stations: stations,
            };

            // 位置情報が提供されている場合、近隣の駅を計算
            if (req.latitude && req.longitude) {
                const nearbyStations = LocationUtils.calculate(
                    stations,
                    req.latitude,
                    req.longitude
                );
                res.nearbyStations = nearbyStations;
            }

            return res;
        } catch (error) {
            console.error("Error in getDataForRoulette:", error);
            throw new Error("Failed to retrieve init form data");
        }
    },
};
