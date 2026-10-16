import { GoalStations } from "@/generated/prisma";

/**
 * 目的駅の追加リクエスト（V3）
 * @property { string } eventCode - イベントコード
 * @property { string } stationCode - 目的駅のコード
 */
export type PostGoalStationsV3Request = {
    eventCode: string;
    stationCode: string;
};

/**
 * 目的駅の追加レスポンス（V3）
 * @property { GoalStations } goalStation - 追加された目的駅情報
 */
export type PostGoalStationsV3Response = {
    goalStation: GoalStations;
};
