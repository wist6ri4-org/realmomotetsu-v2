import LocationUtils from "@/utils/locationUtils";
import { InitFormService } from "./interface";
import { InitFormRequest, InitFormResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { ClosestStation } from "@/types/ClosestStation";
import { ApiError, InternalServerError } from "@/error";

export const InitFormServiceImpl: InitFormService = {
    /**
     * フォーム画面の初期化データを取得する
     * @param {InitFormRequest} req - リクエスト
     * @returns {Promise<InitFormResponse>} レスポンス
     */
    async getDataForForm(req: InitFormRequest): Promise<InitFormResponse> {
        const eventsRepository = RepositoryFactory.getEventsRepository();
        const stationsRepository = RepositoryFactory.getStationsRepository();

        try {
            // イベント種別の取得
            const events = await eventsRepository.findByEventCodeWithRelations(req.eventCode);
            const eventTypeCode = events?.eventTypeCode || "";

            // レスポンスの作成
            const [stations] = await Promise.all([stationsRepository.findByEventTypeCode(eventTypeCode)]);
            const res: InitFormResponse = {};

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
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${arguments.callee.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
