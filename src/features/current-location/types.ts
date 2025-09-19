import { Points, PointStatus, TransitStations } from "@/generated/prisma";

/**
 * 現在地とポイント登録のリクエスト
 * @property { string } eventCode - イベントコード
 * @property { string } teamCode - チームコード
 * @property { string } stationCode - 駅コード
 * @property { number } points - ポイント数
 */
export type PostCurrentLocationRequest = {
    eventCode: string;
    teamCode: string;
    stationCode: string;
    points: number;
    status?: PointStatus;
};

/**
 * 現在地とポイント登録のレスポンス
 * @property { TransitStations } transitStation - 登録された経由駅
 * @property { Points } point - 登録されたポイント
 */
export type PostCurrentLocationResponse = {
    transitStation: TransitStations;
    point: Points;
};
