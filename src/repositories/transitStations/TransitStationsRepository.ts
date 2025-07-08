import { TransitStations, Events, Stations } from "@/generated/prisma";
import { BaseRepository } from "../base/BaseRepository";

// includeありのTransitStationsの型定義
type TransitStationWithRelations = TransitStations & {
    event: Events;
    station: Stations;
};

/**
 * 経由駅関連のデータアクセス処理を担当するRepository
 */
export class TransitStationsRepository extends BaseRepository {
    /**
     * 指定されたイベントの経由駅を取得
     * @param eventCode - イベントコード
     * @returns {Promise<TransitStationWithRelations[]>} 経由駅の配列
     */
    async findByEventCode(eventCode: string): Promise<TransitStationWithRelations[]> {
        try {
            return (await this.prisma.transitStations.findMany({
                where: {
                    eventCode: eventCode,
                },
                include: {
                    event: true,
                    station: true,
                },
                orderBy: {
                    id: "asc",
                },
            })) as TransitStationWithRelations[];
        } catch (error) {
            this.handleDatabaseError(error, "findByEventCode");
        }
    }

    /**
     * 指定された駅が経由駅として使用されているイベントを取得
     * @param stationCode - 駅コード
     * @returns {Promise<TransitStationWithRelations[]>} 経由駅の配列
     */
    async findByStationCode(stationCode: string): Promise<TransitStationWithRelations[]> {
        try {
            return (await this.prisma.transitStations.findMany({
                where: {
                    stationCode: stationCode,
                },
                include: {
                    event: true,
                    station: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            })) as TransitStationWithRelations[];
        } catch (error) {
            this.handleDatabaseError(error, "findByStationCode");
        }
    }

    /**
     * 特定のイベントと駅の組み合わせで経由駅を取得
     * @param eventCode - イベントコード
     * @param stationCode - 駅コード
     * @returns {Promise<TransitStations | null>} 経由駅情報またはnull
     */
    async findByEventAndStation(
        eventCode: string,
        stationCode: string
    ): Promise<TransitStations | null> {
        try {
            return await this.prisma.transitStations.findFirst({
                where: {
                    eventCode: eventCode,
                    stationCode: stationCode,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findByEventAndStation");
        }
    }

    /**
     * IDで経由駅を取得
     * @param id - 経由駅ID
     * @returns {Promise<TransitStationWithRelations | null>} 経由駅情報またはnull
     */
    async findById(id: number): Promise<TransitStationWithRelations | null> {
        try {
            return (await this.prisma.transitStations.findUnique({
                where: {
                    id: id,
                },
                include: {
                    event: true,
                    station: true,
                },
            })) as TransitStationWithRelations | null;
        } catch (error) {
            this.handleDatabaseError(error, "findById");
        }
    }

    /**
     * すべての経由駅を取得
     * @returns {Promise<TransitStationWithRelations[]>} 経由駅の配列
     */
    async findAll(): Promise<TransitStationWithRelations[]> {
        try {
            return (await this.prisma.transitStations.findMany({
                include: {
                    event: true,
                    station: true,
                },
                orderBy: [{ eventCode: "asc" }, { id: "asc" }],
            })) as TransitStationWithRelations[];
        } catch (error) {
            this.handleDatabaseError(error, "findAll");
        }
    }

    /**
     * 新しい経由駅を作成
     * @param transitStationData - 経由駅作成データ
     * @returns {Promise<TransitStations>} 作成された経由駅
     */
    async create(transitStationData: {
        stationCode: string;
        eventCode: string;
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
     * @param id - 削除する経由駅ID
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
     * 特定のイベントと駅の組み合わせで経由駅を削除
     * @param eventCode - イベントコード
     * @param stationCode - 駅コード
     * @returns {Promise<TransitStations | null>} 削除された経由駅またはnull
     */
    async deleteByEventAndStation(
        eventCode: string,
        stationCode: string
    ): Promise<TransitStations | null> {
        try {
            const transitStation = await this.findByEventAndStation(eventCode, stationCode);
            if (transitStation) {
                return await this.delete(transitStation.id);
            }
            return null;
        } catch (error) {
            this.handleDatabaseError(error, "deleteByEventAndStation");
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

    /**
     * 指定された駅が経由駅として使用されているイベント数を取得
     * @param stationCode - 駅コード
     * @returns {Promise<number>} イベントの数
     */
    async countEventsByStation(stationCode: string): Promise<number> {
        try {
            return await this.prisma.transitStations.count({
                where: {
                    stationCode: stationCode,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "countEventsByStation");
        }
    }
}
