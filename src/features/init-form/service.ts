import LocationUtils from "@/utils/locationUtils";
import { InitFormService } from "./interface";
import { InitFormRequest, InitFormResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";

export const InitFormServiceImpl: InitFormService = {
    /**
     * ホーム画面の初期化データを取得する
     * @param req - リクエストデータ
     * @returns {Promise<InitFormResponse>} ホーム画面の初期化データ
     */
    async getDataForForm(req: InitFormRequest): Promise<InitFormResponse> {
        // Repositoryのインスタンスを取得
        const teamsRepository = RepositoryFactory.getTeamsRepository();
        const stationsRepository = RepositoryFactory.getStationsRepository();
        const eventsRepository = RepositoryFactory.getEventsRepository();

        try {
            const events = await eventsRepository.findByEventCodeWithRelations(req.eventCode);
            const eventTypeCode = events?.eventTypeCode || "";

            const [teams, stations] = await Promise.all([
                teamsRepository.findByEventCode(req.eventCode),
                stationsRepository.findByEventTypeCode(eventTypeCode),
            ]);

            const res: InitFormResponse = {
                teams: teams,
                stations: stations,
            };

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
            console.error("Error in getDataForForm:", error);
            throw new Error("Failed to retrieve init form data");
        }
    },
};
