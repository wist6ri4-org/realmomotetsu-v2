import { GoalStationsWithRelations } from "@/repositories/goalStations/GoalStationsRepository";

/**
 * 目的駅の取得リクエスト
 * @param eventCode - イベントコード
 */
export type GetGoalStationsRequest = {
    eventCode: string;
};

/**
 * 目的駅の取得レスポンス
 * @param stations - 目的駅の配列
 */
export type GetGoalStationsResponse = {
    stations: GoalStationsWithRelations[];
};

/**
 * 目的駅の追加リクエスト
 * @param eventCode - イベントコード
 * @param stationCode - 駅コード
 */
export type PostGoalStationsRequest = {
    eventCode: string;
    stationCode: string;
};
