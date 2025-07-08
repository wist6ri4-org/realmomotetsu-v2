import { EventTypes, Events, Stations } from "@/generated/prisma";
import { BaseRepository } from "../base/BaseRepository";

// includeありのEventTypesの型定義
type EventTypeWithRelations = EventTypes & {
    events?: Events[];
    stations?: Stations[];
};

/**
 * イベント種別関連のデータアクセス処理を担当するRepository
 */
export class EventTypesRepository extends BaseRepository {
    /**
     * イベント種別コードでイベント種別を取得
     * @param eventTypeCode - イベント種別コード
     * @returns {Promise<EventTypes | null>} イベント種別情報またはnull
     */
    async findByEventTypeCode(eventTypeCode: string): Promise<EventTypes | null> {
        try {
            return await this.prisma.eventTypes.findUnique({
                where: {
                    eventTypeCode: eventTypeCode,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findByEventTypeCode");
        }
    }

    /**
     * 関連データ込みでイベント種別コードでイベント種別を取得
     * @param eventTypeCode - イベント種別コード
     * @returns {Promise<EventTypeWithRelations | null>} イベント種別情報またはnull
     */
    async findByEventTypeCodeWithRelations(
        eventTypeCode: string
    ): Promise<EventTypeWithRelations | null> {
        try {
            return (await this.prisma.eventTypes.findUnique({
                where: {
                    eventTypeCode: eventTypeCode,
                },
                include: {
                    events: true,
                    stations: true,
                },
            })) as EventTypeWithRelations | null;
        } catch (error) {
            this.handleDatabaseError(error, "findByEventTypeCodeWithRelations");
        }
    }

    /**
     * すべてのイベント種別を取得
     * @returns {Promise<EventTypes[]>} イベント種別の配列
     */
    async findAll(): Promise<EventTypes[]> {
        try {
            return await this.prisma.eventTypes.findMany({
                orderBy: {
                    eventTypeCode: "asc",
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findAll");
        }
    }

    /**
     * IDでイベント種別を取得
     * @param id - イベント種別ID
     * @returns {Promise<EventTypes | null>} イベント種別情報またはnull
     */
    async findById(id: number): Promise<EventTypes | null> {
        try {
            return await this.prisma.eventTypes.findUnique({
                where: {
                    id: id,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findById");
        }
    }

    /**
     * 新しいイベント種別を作成
     * @param eventTypeData - イベント種別作成データ
     * @returns {Promise<EventTypes>} 作成されたイベント種別
     */
    async create(eventTypeData: {
        eventTypeCode: string;
        description?: string;
    }): Promise<EventTypes> {
        try {
            return await this.prisma.eventTypes.create({
                data: eventTypeData,
            });
        } catch (error) {
            this.handleDatabaseError(error, "create");
        }
    }

    /**
     * イベント種別情報を更新
     * @param eventTypeCode - 更新対象のイベント種別コード
     * @param updateData - 更新データ
     * @returns {Promise<EventTypes>} 更新されたイベント種別
     */
    async update(
        eventTypeCode: string,
        updateData: {
            description?: string;
        }
    ): Promise<EventTypes> {
        try {
            return await this.prisma.eventTypes.update({
                where: {
                    eventTypeCode: eventTypeCode,
                },
                data: updateData,
            });
        } catch (error) {
            this.handleDatabaseError(error, "update");
        }
    }

    /**
     * イベント種別を削除
     * @param eventTypeCode - 削除するイベント種別コード
     * @returns {Promise<EventTypes>} 削除されたイベント種別
     */
    async delete(eventTypeCode: string): Promise<EventTypes> {
        try {
            return await this.prisma.eventTypes.delete({
                where: {
                    eventTypeCode: eventTypeCode,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "delete");
        }
    }

    /**
     * 説明文で部分一致検索
     * @param searchTerm - 検索語
     * @returns {Promise<EventTypes[]>} イベント種別の配列
     */
    async searchByDescription(searchTerm: string): Promise<EventTypes[]> {
        try {
            return await this.prisma.eventTypes.findMany({
                where: {
                    description: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                },
                orderBy: {
                    eventTypeCode: "asc",
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "searchByDescription");
        }
    }
}
