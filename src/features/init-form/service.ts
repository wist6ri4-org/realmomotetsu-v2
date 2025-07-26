import LocationUtils from "@/utils/locationUtils";
import { InitFormService } from "./interface";
import { InitFormRequest, InitFormResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { ClosestStation } from "@/types/ClosestStation";

export const InitFormServiceImpl: InitFormService = {
    /**
     * フォーム画面の初期化データを取得する
     * @param req - リクエストデータ
     * @returns {Promise<InitFormResponse>} フォーム画面の初期化データ
     */
    async getDataForForm(req: InitFormRequest): Promise<InitFormResponse> {
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
            const res: InitFormResponse = {
                teams: teams,
                stations: stations,
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
            console.error("Error in getDataForForm:", error);
            throw new Error("Failed to retrieve init form data");
        }
    },
};
