import { GoalStations } from "@/generated/prisma";
import { GoalStationsWithRelations } from "@/repositories/goalStations/GoalStationsRepository";

/**
 * 目的駅の取得リクエスト
 * @property { string } eventCode - イベントコード
 */
export type GetGoalStationsRequest = {
    eventCode: string;
};

/**
 * 目的駅の取得レスポンス
 * @property { GoalStationsWithRelations[] } goalStations - イベントに関連する目的駅のリスト
 */
export type GetGoalStationsResponse = {
    goalStations: GoalStationsWithRelations[];
};

/**
 * 目的駅の追加リクエスト
 * @property { string } eventCode - イベントコード
 * @property { string } stationCode - 目的駅のコード
 */
export type PostGoalStationsRequest = {
    eventCode: string;
    stationCode: string;
};

/**
 * 目的駅の追加レスポンス
 * @property { GoalStations } goalStation - 追加された目的駅情報
 */
export type PostGoalStationsResponse = {
    goalStation: GoalStations;
};
