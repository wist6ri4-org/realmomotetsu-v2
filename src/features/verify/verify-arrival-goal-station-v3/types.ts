import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";

/**
 * 処理可否チェック（目的駅到着処理（V3））のリクエスト
 * @property { string } eventTypeCode - イベント種別コード
 * @property { string } eventCode - イベントコード
 * @property { string } teamCode - チームコード
 * @property { boolean } willPurchase - 物件駅購入選択
 */
export type PostVerifyArrivalGoalStationV3Request = {
    eventTypeCode: string;
    eventCode: string;
    teamCode: string;
    willPurchase: boolean;
};

/**
 * 処理可否チェック（目的駅到着処理（V3））のレスポンス
 * @property { VerifyArrivalGoalStationV3Result } result - 処理結果
 */
export type PostVerifyArrivalGoalStationV3Response = {
    result: VerifyArrivalGoalStationV3Result;
};

/**
 * 処理可否チェック結果
 * @property { number } VERIFIED - 処理可
 * @property { number } E01_ALREADY_PURCHASED - すでに駅が購入されている
 * @property { number } E02_INSUFFICIENT_POINTS - ポイント不足
 * @property { number } W01_STATION_MISMATCH - 最新の経由駅が目的駅と一致しない
 */
export enum VerifyArrivalGoalStationV3Result {
    VERIFIED = "VERIFIED",
    E01_ALREADY_PURCHASED = "E01_ALREADY_PURCHASED",
    E02_INSUFFICIENT_POINTS = "E02_INSUFFICIENT_POINTS",
    W01_STATION_MISMATCH = "W01_STATION_MISMATCH",
}
