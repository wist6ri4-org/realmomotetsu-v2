import { Stations, PropertyPurchases, Events, Teams } from "@/generated/prisma";
import { BaseRepository, PrismaTransactionClient } from "../base/BaseRepository";

/**
 * 物件駅購入情報のリレーションを含む型定義
 * @property { Events } event - イベント情報
 * @property { Teams } team - チーム情報
 * @property { Stations } station - 駅情報
 */
export type PropertyPurchasesWithRelations = PropertyPurchases & {
    event: Events;
    team: Teams;
    station: Stations;
};

/**
 * 物件駅購入情報の路線図用の型定義
 * @property { string } stationCode - 駅コード
 * @property { object } team - チーム情報
 * @property { string | null } team.teamColor - チームカラー
 */
export type PropertyPurchasesForRoutemap = {
    stationCode: string;
    team: {
        teamColor: string | null;
    };
};

/**
 * 物件駅購入情報のデータアクセス処理を担当するRepository
 */
export class PropertyPurchasesRepository extends BaseRepository {
    /**
     * イベントコードで物件駅購入情報を取得
     * @param eventCode - イベントコード
     * @returns {Promise<PropertyPurchasesWithRelations[]>} 物件駅購入情報の配列
     */
    async findByEventCode(eventCode: string): Promise<PropertyPurchasesWithRelations[]> {
        try {
            return (await this.prisma.propertyPurchases.findMany({
                where: {
                    eventCode: eventCode,
                },
                include: {
                    event: true,
                    team: true,
                    station: true,
                },
                orderBy: {
                    createdAt: "asc",
                },
            })) as PropertyPurchasesWithRelations[];
        } catch (error) {
            this.handleDatabaseError(error, this.findByEventCode.name);
        }
    }

    /**
     * 路線図用の物件駅情報を取得
     *
     * @param eventCode - イベントコード
     */
    async findPurchasedByEventCode(eventCode: string): Promise<PropertyPurchasesForRoutemap[]> {
        try {
            return await this.prisma.propertyPurchases.findMany({
                select: {
                    stationCode: true,
                    team: {
                        select: {
                            teamColor: true,
                        },
                    },
                },
                where: {
                    eventCode: eventCode,
                },
                orderBy: {
                    createdAt: "asc",
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, this.findPurchasedByEventCode.name);
        }
    }

    /**
     * チームコードで物件駅購入情報を取得
     * @param teamCode - チームコード
     * @returns {Promise<PropertyPurchasesWithRelations[]>} 物件駅購入情報の配列
     */
    async findByTeamCode(teamCode: string): Promise<PropertyPurchasesWithRelations[]> {
        try {
            return (await this.prisma.propertyPurchases.findMany({
                where: {
                    teamCode: teamCode,
                },
                include: {
                    event: true,
                    team: true,
                    station: true,
                },
                orderBy: {
                    createdAt: "asc",
                },
            })) as PropertyPurchasesWithRelations[];
        } catch (error) {
            this.handleDatabaseError(error, this.findByTeamCode.name);
        }
    }

    /**
     * イベントコードと駅コードで物件駅購入情報を取得
     * @param eventCode - イベントコード
     * @param stationCode - 駅コード
     * @param tx - トランザクションクライアント（オプション）
     * @returns {Promise<PropertyPurchasesWithRelations | null>} 物件駅購入情報
     */
    async findByEventCodeAndStationCode(
        eventCode: string,
        stationCode: string,
        tx?: PrismaTransactionClient,
    ): Promise<PropertyPurchasesWithRelations | null> {
        const client = tx ?? this.prisma;
        try {
            return (await client.propertyPurchases.findFirst({
                where: {
                    eventCode: eventCode,
                    stationCode: stationCode,
                },
                include: {
                    event: true,
                    team: true,
                    station: true,
                },
            })) as PropertyPurchasesWithRelations | null;
        } catch (error) {
            this.handleDatabaseError(error, this.findByEventCodeAndStationCode.name);
        }
    }

    /**
     * 物件駅購入情報を作成
     * @param propertyPurchaseData - 作成する物件駅購入情報のデータ
     * @param tx - トランザクションクライアント（オプション）
     * @returns {Promise<PropertyPurchases>} 作成された物件駅購入情報
     */
    async create(
        propertyPurchaseData: {
            eventCode: string;
            teamCode: string;
            stationCode: string;
        },
        tx?: PrismaTransactionClient,
    ): Promise<PropertyPurchases> {
        const client = tx ?? this.prisma;
        try {
            return await client.propertyPurchases.create({
                data: propertyPurchaseData,
            });
        } catch (error) {
            this.handleDatabaseError(error, this.create.name);
        }
    }

    /**
     * 物件駅購入情報を更新
     * @param id - 更新対象のID
     * @param updateData - 更新データ
     * @param tx - トランザクションクライアント（オプション）
     * @returns {Promise<PropertyPurchases>} 更新された物件駅購入情報
     */
    async update(
        id: number,
        updateData: {
            eventCode?: string;
            teamCode?: string;
            stationCode?: string;
        },
        tx?: PrismaTransactionClient,
    ): Promise<PropertyPurchases> {
        const client = tx ?? this.prisma;
        try {
            return await client.propertyPurchases.update({
                where: {
                    id: id,
                },
                data: updateData,
            });
        } catch (error) {
            this.handleDatabaseError(error, this.update.name);
        }
    }

    /**
     * 物件駅購入情報を削除
     * @param id - 削除対象のID
     * @param tx - トランザクションクライアント（オプション）
     * @returns {Promise<PropertyPurchases>} 削除された物件駅購入情報
     */
    async delete(id: number, tx?: PrismaTransactionClient): Promise<PropertyPurchases> {
        const client = tx ?? this.prisma;
        try {
            return await client.propertyPurchases.delete({
                where: {
                    id: id,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, this.delete.name);
        }
    }
}
