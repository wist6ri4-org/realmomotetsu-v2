import { LatestTransitStations } from "@/generated/prisma";
/**
 * 最新経由駅の取得リクエスト
 * @param eventCode - イベントコード
 */
export type GetLatestTransitStationsRequest = {
    eventCode: string;
};

/**
 * 最新経由駅の取得レスポンス
 */
export type GetLatestTransitStationsResponse = LatestTransitStations[];
