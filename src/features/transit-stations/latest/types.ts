import { LatestTransitStations } from "@/generated/prisma";
/**
 * 最新経由駅の取得リクエスト
 * @property { string } eventCode - イベントコード
 */
export type GetLatestTransitStationsRequest = {
    eventCode: string;
};

/**
 * 最新経由駅の取得レスポンス
 * @property { LatestTransitStations[] } latestTransitStations - 最新の経由駅の配列
 */
export type GetLatestTransitStationsResponse = {
    latestTransitStations: LatestTransitStations[];
};
