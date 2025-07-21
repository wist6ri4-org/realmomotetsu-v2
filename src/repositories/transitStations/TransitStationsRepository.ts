import { TransitStations, Stations, LatestTransitStations } from "@/generated/prisma";
import { BaseRepository } from "../base/BaseRepository";

// includeありのTransitStationsの型定義
export type TransitStationsWithRelations = TransitStations & {
    station: Stations;
};

/**
 * 経由駅関連のデータアクセス処理を担当するRepository
 */
export class TransitStationsRepository extends BaseRepository {
    /**
     * 指定されたイベントの経由駅を取得
     * @param eventCode - イベントコード
     * @returns {Promise<TransitStationsWithRelations[]>} 経由駅の配列
     */
    async findByEventCode(eventCode: string): Promise<TransitStationsWithRelations[]> {
        try {
            return (await this.prisma.transitStations.findMany({
                where: {
                    eventCode: eventCode,
                },
                include: {
                    station: true,
                },
                orderBy: {
                    id: "asc",
                },
            })) as TransitStationsWithRelations[];
        } catch (error) {
            this.handleDatabaseError(error, "findByEventCode");
        }
    }

    /**
     * 指定されたイベントコードに紐づく最新の経由駅を取得
     * @param eventCode - イベントコード
     * @returns {Promise<LatestTransitStations[]>} 最新経由駅の配列
     */
    async findLatestByEventCode(eventCode: string): Promise<LatestTransitStations[]> {
        try {
            return await this.prisma.latestTransitStations.findMany({
                where: {
                    eventCode: eventCode,
                },
                orderBy: {
                    teamCode: "asc",
                },
            }) as LatestTransitStations[];
        } catch (error) {
            this.handleDatabaseError(error, "findLatestByEventCode");
        }
    }

    /**
     * IDで経由駅を取得
     * @param id - 経由駅ID
     * @returns {Promise<TransitStationsWithRelations | null>} 経由駅情報またはnull
     */
    async findById(id: number): Promise<TransitStationsWithRelations | null> {
        try {
            return (await this.prisma.transitStations.findUnique({
                where: {
                    id: id,
                },
                include: {
                    station: true,
                },
            })) as TransitStationsWithRelations | null;
        } catch (error) {
            this.handleDatabaseError(error, "findById");
        }
    }

    /**
     * 新しい経由駅を作成
     * @param transitStationData - 経由駅作成データ
     * @returns {Promise<TransitStations>} 作成された経由駅
     */
    async create(transitStationData: {
        eventCode: string;
        teamCode: string;
        stationCode: string;
    }): Promise<TransitStations> {
        try {
            return await this.prisma.transitStations.create({
                data: transitStationData,
            });
        } catch (error) {
            this.handleDatabaseError(error, "create");
        }
    }

    /**
     * 複数の経由駅を一括作成
     * @param transitStationsData - 経由駅作成データの配列
     * @returns {Promise<number>} 作成された経由駅の数
     */
    async createMany(
        transitStationsData: {
            stationCode: string;
            eventCode: string;
            teamCode: string;
        }[]
    ): Promise<number> {
        try {
            const result = await this.prisma.transitStations.createMany({
                data: transitStationsData,
                skipDuplicates: true,
            });
            return result.count;
        } catch (error) {
            this.handleDatabaseError(error, "createMany");
        }
    }

    /**
     * 経由駅を削除
     * @param id - 削除対象のID
     * @returns {Promise<TransitStations>} 削除された経由駅
     */
    async delete(id: number): Promise<TransitStations> {
        try {
            return await this.prisma.transitStations.delete({
                where: {
                    id: id,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "delete");
        }
    }

    /**
     * 指定されたイベントのすべての経由駅を削除
     * @param eventCode - イベントコード
     * @returns {Promise<number>} 削除された経由駅の数
     */
    async deleteAllByEvent(eventCode: string): Promise<number> {
        try {
            const result = await this.prisma.transitStations.deleteMany({
                where: {
                    eventCode: eventCode,
                },
            });
            return result.count;
        } catch (error) {
            this.handleDatabaseError(error, "deleteAllByEvent");
        }
    }

    /**
     * 指定されたイベントの経由駅数を取得
     * @param eventCode - イベントコード
     * @returns {Promise<number>} 経由駅の数
     */
    async countByEvent(eventCode: string): Promise<number> {
        try {
            return await this.prisma.transitStations.count({
                where: {
                    eventCode: eventCode,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "countByEvent");
        }
    }
}
