import { GoalStationsWithRelations } from "@/repositories/goalStations/GoalStationsRepository";

/**
 * 最新目的駅の取得リクエスト
 * @property { string } eventCode - イベントコード
 */
export type GetLatestGoalStationsRequest = {
    eventCode: string;
};

/**
 * 最新目的駅の取得レスポンス
 * @property { GoalStationsWithRelations } goalStation - 最新目的駅
 */
export type GetLatestGoalStationsResponse = {
    goalStation: GoalStationsWithRelations;
};
