import { Stations } from "@/generated/prisma";

/**
 * 目的駅到着処理（V3）のリクエスト
 * @property { string } eventTypeCode - イベント種別コード
 * @property { string } eventCode - イベントコード
 * @property { string } teamCode - チームコード
 * @property { Stations[] } stations - 駅情報
 */
export type PostArrivalGoalStationV3Request = {
    eventTypeCode: string;
    eventCode: string;
    teamCode: string;
    stations: Stations[];
};

/**
 * 目的駅到着処理（V3）のレスポンス
 * @property { number } points - ポイント
 * @property { number } consecutiveGoalCounts - 連続ゴール数
 * @property { number | null } consecutiveGoalBonus - 連続ゴールボーナス
 */
export type PostArrivalGoalStationV3Response = {
    points: number;
    consecutiveGoalCount: number;
    consecutiveGoalBonus: number | null;
};
