import { TransitStationsGroupedByTeamCode } from "@/types/TransitStationsGroupedByTeamCode";

/**
 * 経由駅の取得リクエスト
 * @param eventCode - イベントコード
 */
export type GetTransitStationsRequest = {
    eventCode: string;
};

/**
 * 経由駅の取得レスポンス
 */
export type GetTransitStationsResponse = TransitStationsGroupedByTeamCode;

/**
 * 経由駅の登録リクエスト
 * @param eventCode - イベントコード
 * @param teamCode - チームコード
 * @param stationCode - 駅コード
 */
export type PostTransitStationsRequest = {
    eventCode: string;
    teamCode: string;
    stationCode: string;
};
