import { GoalStations } from "@/generated/prisma";
import { GoalStationsService } from "./interface";
import { GetGoalStationsRequest, GetGoalStationsResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";

export const GoalStationsServiceImpl: GoalStationsService = {
    /**
     * イベントコードに紐づく目的駅を全件取得する
     * @param req - リクエストデータ
     * @return {Promise<GetGoalStationsResponse>} 目的駅のリスト
     */
    async getGoalStationsByEventCode(req: GetGoalStationsRequest): Promise<GetGoalStationsResponse> {
        const goalStationsRepository = RepositoryFactory.getGoalStationsRepository();

        try {
            const eventCode = req.eventCode;
            const goalStations = await goalStationsRepository.findByEventCode(eventCode);
            const res: GetGoalStationsResponse = {
                stations: goalStations,
            };

            return res;
        } catch (error) {
            console.error("Error in getGoalStationsByEventCode:", error);
            throw new Error("Failed to retrieve get goal stations");
        }
    },

    /**
     * 目的駅を登録する
     * @param req - リクエストデータ
     * @return {Promise<void>} 登録完了
     */
    async postGoalStations(req: { eventCode: string; stationCode: string }): Promise<GoalStations> {
        const goalStationsRepository = RepositoryFactory.getGoalStationsRepository();

        try {
            return await goalStationsRepository.create({
                eventCode: req.eventCode,
                stationCode: req.stationCode,
            }

            );
        } catch (error) {
            console.error("Error in postGoalStations:", error);
            throw new Error("Failed to register goal station");
        }
    }
};
