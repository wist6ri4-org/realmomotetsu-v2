import { TransitStationsGroupedByTeamCode } from "@/types/TransitStationsGroupedByTeamCode";
import { GetTransitStationsRequest, PostTransitStationsRequest } from "./types";
import { TransitStations } from "@/generated/prisma";

export interface TransitStationsService {
    /**
     * イベントコードに紐づく経由駅をチームコードごとに取得する
     * @param req - リクエストデータ
     * @return {Promise<TransitStationsGroupedByTeamCode[]>} チームコードごとの経由駅のリスト
     */
    getTransitStationsByEventCodeGroupedByTeamCode: (
        req: GetTransitStationsRequest
    ) => Promise<TransitStationsGroupedByTeamCode>;

    /**
     * 経由駅を登録する
     * @param req - リクエストデータ
     * @return {Promise<void>} 登録完了
     */
    postTransitStations: (req: PostTransitStationsRequest) => Promise<TransitStations>;
}
