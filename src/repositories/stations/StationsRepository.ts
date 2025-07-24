import {
    Stations,
    EventTypes,
    NearbyStations,
    GoalStations,
    TransitStations,
} from "@/generated/prisma";
import { BaseRepository } from "../base/BaseRepository";

// includeありのStationsの型定義
export type StationWithRelations = Stations & {
    eventType?: EventTypes;
    fromStations?: (NearbyStations & { toStation: Stations })[];
    toStations?: (NearbyStations & { fromStation: Stations })[];
    goalStations?: GoalStations[];
    transitStations?: TransitStations[];
};

/**
 * 駅関連のデータアクセス処理を担当するRepository
 */
export class StationsRepository extends BaseRepository {
    /**
     * 駅コードで駅を取得
     * @param stationCode - 駅コード
     * @returns {Promise<Stations | null>} 駅情報またはnull
     */
    async findByStationCode(stationCode: string): Promise<Stations | null> {
        try {
            return await this.prisma.stations.findUnique({
                where: {
                    stationCode: stationCode,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findByStationCode");
        }
    }

    /**
     * 関連データ込みで駅コードで駅を取得
     * @param stationCode - 駅コード
     * @returns {Promise<StationWithRelations | null>} 駅情報またはnull
     */
    async findByStationCodeWithRelations(
        stationCode: string
    ): Promise<StationWithRelations | null> {
        try {
            return (await this.prisma.stations.findUnique({
                where: {
                    stationCode: stationCode,
                },
                include: {
                    eventType: true,
                    fromStations: {
                        include: {
                            toStation: true,
                        },
                    },
                    toStations: {
                        include: {
                            fromStation: true,
                        },
                    },
                    goalStations: true,
                    transitStations: true,
                },
            })) as StationWithRelations | null;
        } catch (error) {
            this.handleDatabaseError(error, "findByStationCodeWithRelations");
        }
    }

    /**
     * イベント種別で駅を検索
     * @param eventTypeCode - イベント種別コード
     * @returns {Promise<Stations[]>} 駅の配列
     */
    async findByEventTypeCode(eventTypeCode: string): Promise<Stations[]> {
        try {
            return await this.prisma.stations.findMany({
                where: {
                    eventTypeCode: eventTypeCode,
                },
                orderBy: {
                    kana: "asc",
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findByEventTypeCode");
        }
    }

    /**
     * イベント種別コードで駅を検索し、関連データを含めて取得
     * @param eventTypeCode - イベント種別コード
     * @returns {Promise<StationWithRelations[]>} 駅の配列
     */
    async findByEventTypeCodeWithRelations(eventTypeCode: string): Promise<StationWithRelations[]> {
        try {
            return (await this.prisma.stations.findMany({
                where: {
                    eventTypeCode: eventTypeCode,
                },
                include: {
                    eventType: true,
                    fromStations: {
                        include: {
                            toStation: true,
                        },
                    },
                    toStations: {
                        include: {
                            fromStation: true,
                        },
                    },
                    goalStations: true,
                    transitStations: true,
                },
                orderBy: {
                    name: "asc",
                },
            })) as StationWithRelations[];
        } catch (error) {
            this.handleDatabaseError(error, "findByEventTypeCodeWithRelations");
        }
    }

    /**
     * 駅名で部分一致検索
     * @param searchTerm - 検索語
     * @returns {Promise<Stations[]>} 駅の配列
     */
    async searchByName(searchTerm: string): Promise<Stations[]> {
        try {
            return await this.prisma.stations.findMany({
                where: {
                    OR: [
                        {
                            name: {
                                contains: searchTerm,
                                mode: "insensitive",
                            },
                        },
                        {
                            kana: {
                                contains: searchTerm,
                                mode: "insensitive",
                            },
                        },
                    ],
                },
                orderBy: {
                    name: "asc",
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "searchByName");
        }
    }

    /**
     * ミッション設定済みの駅を取得
     * @param eventTypeCode - イベント種別コード
     * @returns {Promise<Stations[]>} 駅の配列
     */
    async findMissionStations(eventTypeCode: string): Promise<Stations[]> {
        try {
            return await this.prisma.stations.findMany({
                where: {
                    eventTypeCode: eventTypeCode,
                    isMissionSet: true,
                },
                orderBy: {
                    name: "asc",
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findMissionStations");
        }
    }

    /**
     * 新しい駅を作成
     * @param stationData - 駅作成データ
     * @returns {Promise<Stations>} 作成された駅
     */
    async create(stationData: {
        stationCode: string;
        name: string;
        kana: string;
        latitude?: number;
        longitude?: number;
        isMissionSet?: boolean;
        eventTypeCode: string;
    }): Promise<Stations> {
        try {
            return await this.prisma.stations.create({
                data: stationData,
            });
        } catch (error) {
            this.handleDatabaseError(error, "create");
        }
    }

    /**
     * 駅情報を更新
     * @param id - 更新対象のID
     * @param updateData - 更新データ
     * @returns {Promise<Stations>} 更新された駅
     */
    async update(
        id: number,
        updateData: {
            stationCode: string;
            name?: string;
            kana?: string;
            latitude?: number;
            longitude?: number;
            isMissionSet?: boolean;
        }
    ): Promise<Stations> {
        try {
            return await this.prisma.stations.update({
                where: {
                    id: id,
                },
                data: updateData,
            });
        } catch (error) {
            this.handleDatabaseError(error, "update");
        }
    }

    /**
     * 駅を削除
     * @param id - 削除対象のID
     * @returns {Promise<Stations>} 削除された駅
     */
    async delete(id: number): Promise<Stations> {
        try {
            return await this.prisma.stations.delete({
                where: {
                    id: id,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "delete");
        }
    }
}
