import { TransitStations } from "@/generated/prisma";
import { TransitStationsGroupedByTeamCode } from "@/types/TransitStationsGroupedByTeamCode";

/**
 * 経由駅の取得リクエスト
 * @property { string } eventCode - イベントコード
 */
export type GetTransitStationsRequest = {
    eventCode: string;
};

/**
 * 経由駅の取得レスポンス
 * @property { TransitStationsGroupedByTeamCode } transitStations - チームコードごとにグループ化された経由駅の情報
 */
export type GetTransitStationsResponse = {
    transitStations: TransitStationsGroupedByTeamCode;
};

/**
 * 経由駅の登録リクエスト
 * @property { string } eventCode - イベントコード
 * @property { string } teamCode - チームコード
 * @property { string } stationCode - 駅コード
 */
export type PostTransitStationsRequest = {
    eventCode: string;
    teamCode: string;
    stationCode: string;
};

/**
 * 経由駅の登録レスポンス
 * @property { TransitStations } transitStation - 登録された経由駅情報
 */
export type PostTransitStationsResponse = {
    transitStation: TransitStations;
};
