import { GoalStations } from "@/generated/prisma";
import { GetGoalStationsRequest, GetGoalStationsResponse, PostGoalStationsRequest } from "./types";

export interface GoalStationsService {
    /**
     * イベントコードに紐づく目的駅を全件取得する
     * @param req - リクエストデータ
     * @return {Promise<GetGoalStationsResponse>} 目的駅のリスト
     */
    getGoalStationsByEventCode: (req: GetGoalStationsRequest) => Promise<GetGoalStationsResponse>;

    /**
     * 目的駅を登録する
     * @param req - リクエストデータ
     * @return {Promise<void>} 登録完了
     */
    postGoalStations: (req: PostGoalStationsRequest) => Promise<GoalStations>;
}
