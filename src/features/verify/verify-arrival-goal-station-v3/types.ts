import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";

/**
 * 処理可否チェック（目的駅到着処理（V3））のリクエスト
 * @property { string } eventTypeCode - イベント種別コード
 * @property { string } eventCode - イベントコード
 * @property { string } teamCode - チームコード
 */
export type PostVerifyArrivalGoalStationV3Request = {
    eventTypeCode: string;
    eventCode: string;
    teamCode: string;
};

/**
 * 処理可否チェック（目的駅到着処理（V3））のレスポンス
 * @property { VerifyArrivalGoalStationV3Result } result - 処理結果
 * @property { string } stationName - 最新の目的駅の駅名
 * @property { number } currentPoints - 現在の持ち金
 * @property { number } arrivalPoints - 到着ポイント
 * @property { number } consecutiveGoalBonus - 連続ゴールボーナス
 */
export type PostVerifyArrivalGoalStationV3Response = {
    result: VerifyArrivalGoalStationV3Result;
    stationName: string;
    currentPoints: number;
    arrivalPoints: number;
    consecutiveGoalBonus: number;
};

/**
 * 処理可否チェック結果
 * @property { number } VERIFIED - 処理可
 * @property { number } W01_STATION_MISMATCH - 最新の経由駅が目的駅と一致しない
 */
export enum VerifyArrivalGoalStationV3Result {
    VERIFIED = "VERIFIED",
    W01_STATION_MISMATCH = "W01_STATION_MISMATCH",
}
