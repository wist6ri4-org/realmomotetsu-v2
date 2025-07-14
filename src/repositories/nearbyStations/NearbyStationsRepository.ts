import { NearbyStations, Stations } from "@/generated/prisma";
import { BaseRepository } from "../base/BaseRepository";

// includeありのNearbyStationsの型定義
export type NearbyStationWithRelations = NearbyStations & {
    fromStation: Stations;
    toStation: Stations;
};

/**
 * 近隣駅関連のデータアクセス処理を担当するRepository
 */
export class NearbyStationsRepository extends BaseRepository {
    /**
     * 指定された駅からの近隣駅を取得
     * @param fromStationCode - 出発駅コード
     * @returns {Promise<NearbyStationWithRelations[]>} 近隣駅の配列
     */
    async findFromStation(fromStationCode: string): Promise<NearbyStationWithRelations[]> {
        try {
            return (await this.prisma.nearbyStations.findMany({
                where: {
                    fromStationCode: fromStationCode,
                },
                include: {
                    fromStation: true,
                    toStation: true,
                },
                orderBy: {
                    timeMinutes: "asc",
                },
            })) as NearbyStationWithRelations[];
        } catch (error) {
            this.handleDatabaseError(error, "findFromStation");
        }
    }

    /**
     * 指定された駅への近隣駅を取得
     * @param toStationCode - 到着駅コード
     * @returns {Promise<NearbyStationWithRelations[]>} 近隣駅の配列
     */
    async findToStation(toStationCode: string): Promise<NearbyStationWithRelations[]> {
        try {
            return (await this.prisma.nearbyStations.findMany({
                where: {
                    toStationCode: toStationCode,
                },
                include: {
                    fromStation: true,
                    toStation: true,
                },
                orderBy: {
                    timeMinutes: "asc",
                },
            })) as NearbyStationWithRelations[];
        } catch (error) {
            this.handleDatabaseError(error, "findToStation");
        }
    }

    /**
     * 2つの駅間の接続情報を取得
     * @param fromStationCode - 出発駅コード
     * @param toStationCode - 到着駅コード
     * @returns {Promise<NearbyStations | null>} 近隣駅情報またはnull
     */
    async findConnection(
        fromStationCode: string,
        toStationCode: string
    ): Promise<NearbyStations | null> {
        try {
            return await this.prisma.nearbyStations.findFirst({
                where: {
                    fromStationCode: fromStationCode,
                    toStationCode: toStationCode,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findConnection");
        }
    }

    /**
     * 指定されたイベント種別コードに関連する近隣駅接続を取得
     * @param eventTypeCode - イベント種別コード
     * @returns {Promise<NearbyStationWithRelations[]>} 近隣駅の配列
     */
    async findByEventTypeCode(eventTypeCode: string): Promise<NearbyStationWithRelations[]> {
        try {
            return (await this.prisma.nearbyStations.findMany({
                where: {
                    eventTypeCode: eventTypeCode,
                },
                include: {
                    fromStation: true,
                    toStation: true,
                },
            })) as NearbyStationWithRelations[];
        } catch (error) {
            this.handleDatabaseError(error, "findByEventCode");
        }
    }

    /**
     * 新しい近隣駅接続を作成
     * @param connectionData - 接続作成データ
     * @returns {Promise<NearbyStations>} 作成された近隣駅接続
     */
    async create(connectionData: {
        fromStationCode: string;
        toStationCode: string;
        eventTypeCode: string;
        timeMinutes: number;
    }): Promise<NearbyStations> {
        try {
            return await this.prisma.nearbyStations.create({
                data: connectionData,
            });
        } catch (error) {
            this.handleDatabaseError(error, "create");
        }
    }

    /**
     * 近隣駅接続情報を更新
     * @param id - 更新対象のID
     * @param updateData - 更新データ
     * @returns {Promise<NearbyStations>} 更新された近隣駅接続
     */
    async update(
        id: number,
        updateData: {
            timeMinutes?: number;
        }
    ): Promise<NearbyStations> {
        try {
            return await this.prisma.nearbyStations.update({
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
     * 近隣駅接続を削除
     * @param id - 削除対象のID
     * @returns {Promise<NearbyStations>} 削除された近隣駅接続
     */
    async delete(id: number): Promise<NearbyStations> {
        try {
            return await this.prisma.nearbyStations.delete({
                where: {
                    id: id,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "delete");
        }
    }

    /**
     * 2つの駅間の接続を削除
     * @param fromStationCode - 出発駅コード
     * @param toStationCode - 到着駅コード
     * @returns {Promise<NearbyStations | null>} 削除された近隣駅接続またはnull
     */
    async deleteConnection(
        fromStationCode: string,
        toStationCode: string
    ): Promise<NearbyStations | null> {
        try {
            const connection = await this.findConnection(fromStationCode, toStationCode);
            if (connection) {
                return await this.delete(connection.id);
            }
            return null;
        } catch (error) {
            this.handleDatabaseError(error, "deleteConnection");
        }
    }
}
