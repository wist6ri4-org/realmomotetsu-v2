import { LatestTransitStations } from "@/generated/prisma";
import { GetLatestTransitStationsRequest } from "./types";

export interface LatestTransitStationsService {
    /**
     * イベントコードに紐づく最新経由駅を取得する
     * @param req - リクエストデータ
     * @return {Promise<LatestTransitStations[]>} 最新経由駅のリスト
     */
    getLatestTransitStationsByEventCode: (
        req: GetLatestTransitStationsRequest
    ) => Promise<LatestTransitStations[]>;
}
