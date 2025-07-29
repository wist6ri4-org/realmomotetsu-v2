import LocationUtils from "@/utils/locationUtils";
import { InitRouletteService } from "./interface";
import { InitRouletteRequest, InitRouletteResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { ClosestStation } from "@/types/ClosestStation";

export const InitRouletteServiceImpl: InitRouletteService = {
    /**
     * ルーレット画面の初期化データを取得する
     * @param {InitRouletteRequest} req - リクエスト
     * @return {Promise<InitRouletteResponse>} レスポンス
     */
    async getDataForRoulette(req: InitRouletteRequest): Promise<InitRouletteResponse> {
        const eventsRepository = RepositoryFactory.getEventsRepository();
        const stationsRepository = RepositoryFactory.getStationsRepository();
        const transitStationsRepository = RepositoryFactory.getTransitStationsRepository();
        const nearbyStationsRepository = RepositoryFactory.getNearbyStationsRepository();

        try {
            // イベント種別の取得
            const events = await eventsRepository.findByEventCodeWithRelations(req.eventCode);
            const eventTypeCode = events?.eventTypeCode || "";

            // レスポンスの作成
            const [stations, latestTransitStations, nearbyStations] = await Promise.all([
                stationsRepository.findByEventTypeCode(eventTypeCode),
                transitStationsRepository.findLatestByEventCode(req.eventCode),
                nearbyStationsRepository.findByEventTypeCode(eventTypeCode),
            ]);
            const res: InitRouletteResponse = {
                stations: stations,
                latestTransitStations: latestTransitStations,
                nearbyStations: nearbyStations,
            };

            // 位置情報が提供されている場合、近隣の駅を計算
            if (req.latitude && req.longitude) {
                const closestStations: ClosestStation[] = LocationUtils.calculate(
                    stations,
                    req.latitude,
                    req.longitude
                );
                res.closestStations = closestStations;
            }

            return res;
        } catch (error) {
            console.error("Error in getDataForRoulette:", error);
            throw new Error("Failed to retrieve init form data");
        }
    },
};
