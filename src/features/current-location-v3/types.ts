import { TransitStations } from "@/generated/prisma";

/**
 * 現在地登録のリクエスト
 * @property { string } eventCode - イベントコード
 * @property { string } teamCode - チームコード
 * @property { string } stationCode - 駅コード
 */
export type PostCurrentLocationV3Request = {
    eventCode: string;
    teamCode: string;
    stationCode: string;
};

/**
 * 現在地登録のレスポンス
 * @property { TransitStations } transitStation - 登録された経由駅
 */
export type PostCurrentLocationV3Response = {
    transitStation: TransitStations;
};
