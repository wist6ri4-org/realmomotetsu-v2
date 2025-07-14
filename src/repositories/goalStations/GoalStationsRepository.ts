import { GoalStations, Stations } from "@/generated/prisma";
import { BaseRepository } from "../base/BaseRepository";

export type GoalStationsWithRelations = GoalStations & {
    station: Stations;
};

/**
 * 目的駅関連のデータアクセス処理を担当するRepository
 */
export class GoalStationsRepository extends BaseRepository {
    /**
     * 指定されたイベントの次の目的駅を取得
     * @param eventCode - イベントコード
     * @returns {Promise<GoalStationsWithRelations | null>} 次の目的駅またはnull
     */
    async findNextGoalStation(eventCode: string): Promise<GoalStationsWithRelations | null> {
        try {
            return await this.prisma.goalStations.findFirst({
                where: {
                    eventCode: eventCode,
                },
                include: {
                    station: true, // Stations情報も含める
                },
                orderBy: {
                    id: "desc",
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findNextGoalStation");
        }
    }

    /**
     * 指定されたイベントのすべての目的駅を取得
     * @param eventCode - イベントコード
     * @returns {Promise<GoalStationsWithRelations[]>} 目的駅の配列
     */
    async findByEventCode(eventCode: string): Promise<GoalStationsWithRelations[]> {
        try {
            return await this.prisma.goalStations.findMany({
                where: {
                    eventCode: eventCode,
                },
                include: {
                    station: true,
                },
                orderBy: {
                    id: "asc",
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findByEventCode");
        }
    }

    /**
     * 新しい目的駅を追加
     * @param eventCode - イベントコード
     * @param stationCode - 駅コード
     * @returns {Promise<GoalStations>} 作成された目的駅
     */
    async create(goalStationData: {eventCode: string, stationCode: string}): Promise<GoalStations> {
        try {
            return await this.prisma.goalStations.create({
                data: goalStationData,
            });
        } catch (error) {
            this.handleDatabaseError(error, "create");
        }
    }

    /**
     * 目的駅を削除
     * @param id - 削除対象のID
     * @returns {Promise<GoalStations>} 削除された目的駅
     */
    async delete(id: number): Promise<GoalStations> {
        try {
            return await this.prisma.goalStations.delete({
                where: {
                    id: id,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "delete");
        }
    }
}
