import { ApiError, InternalServerError } from "@/error";
import { InitService } from "./interface";
import { InitRequest, InitResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";

export const InitServiceImpl: InitService = {
    /**
     * 初期化データを取得する
     * @param {InitFormRequest} req - リクエスト
     * @returns {Promise<InitFormResponse>} レスポンス
     */
    async getDataForInit(req: InitRequest): Promise<InitResponse> {
        const eventsRepository = RepositoryFactory.getEventsRepository();
        const teamsRepository = RepositoryFactory.getTeamsRepository();
        const stationsRepository = RepositoryFactory.getStationsRepository();
        const nearbyStationsRepository = RepositoryFactory.getNearbyStationsRepository();
        const documentsRepository = RepositoryFactory.getDocumentsRepository();
        const usersRepository = RepositoryFactory.getUsersRepository();

        try {
            // イベント種別の取得
            const events = await eventsRepository.findByEventCodeWithRelations(req.eventCode);
            const eventTypeCode = events?.eventTypeCode || "";

            // レスポンスの作成
            const [teams, stations, nearbyStations, documents, user] = await Promise.all([
                teamsRepository.findByEventCode(req.eventCode),
                stationsRepository.findByEventTypeCode(eventTypeCode),
                nearbyStationsRepository.findByEventTypeCode(eventTypeCode),
                documentsRepository.findByEventCode(req.eventCode),
                usersRepository.findByUuid(req.uuid),
            ]);
            const res: InitResponse = {
                teams: teams,
                stations: stations,
                nearbyStations: nearbyStations,
                documents: documents,
                user: user,
                event: events,
            };

            return res;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${this.getDataForInit.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
