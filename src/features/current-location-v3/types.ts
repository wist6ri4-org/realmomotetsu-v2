import { Points, StationType, TransitStations } from "@/generated/prisma";

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
 * @property { Points } point - 登録されたポイント（物件駅の場合は所有チームの収益）
 * @property { Points } paymentPoint - 物件駅で到着したチームが支払ったポイント
 * @property { StationType } stationType - 登録された駅のタイプ
 */
export type PostCurrentLocationV3Response = {
    transitStation: TransitStations;
    point?: Points;
    paymentPoint?: Points;
    stationType?: StationType;
};
