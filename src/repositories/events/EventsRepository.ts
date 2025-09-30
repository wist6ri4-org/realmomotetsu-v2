import {
    Events,
    EventTypes,
    Teams,
    GoalStations,
    TransitStations,
    BombiiHistories,
    Stations,
} from "@/generated/prisma";
import { BaseRepository } from "../base/BaseRepository";

// includeありのEventsの型定義
export type EventWithRelations = Events & {
    eventType: EventTypes;
    teams?: Teams[];
    goalStations?: (GoalStations & { station: Stations })[];
    transitStations?: (TransitStations & { station: Stations })[];
    bombiiHistories?: (BombiiHistories & { team: Teams })[];
};

/**
 * イベント関連のデータアクセス処理を担当するRepository
 */
export class EventsRepository extends BaseRepository {
    /**
     * イベントコードでイベントを取得
     * @param eventCode - イベントコード
     * @returns {Promise<Events>} イベント情報
     */
    async findByEventCode(eventCode: string): Promise<Events> {
        try {
            return await this.prisma.events.findUniqueOrThrow({
                where: {
                    eventCode: eventCode,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findByEventCode");
        }
    }

    /**
     * 関連データ込みでイベントコードでイベントを取得
     * @param eventCode - イベントコード
     * @returns {Promise<EventWithRelations>} イベント情報
     */
    async findByEventCodeWithRelations(eventCode: string): Promise<EventWithRelations> {
        try {
            return (await this.prisma.events.findUnique({
                where: {
                    eventCode: eventCode,
                },
                include: {
                    eventType: true,
                    teams: true,
                    goalStations: {
                        include: {
                            station: true,
                        },
                    },
                    transitStations: {
                        include: {
                            station: true,
                        },
                    },
                    bombiiHistories: {
                        include: {
                            team: true,
                        },
                    },
                },
            })) as EventWithRelations;
        } catch (error) {
            this.handleDatabaseError(error, "findByEventCodeWithRelations");
        }
    }

    /**
     * すべてのイベントを取得
     * @returns {Promise<Events[]>} イベントの配列
     */
    async findAll(): Promise<Events[]> {
        try {
            return await this.prisma.events.findMany({
                include: {
                    eventType: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findAll");
        }
    }

    /**
     * イベント種別でイベントを検索
     * @param eventTypeCode - イベント種別コード
     * @returns {Promise<Events[]>} イベントの配列
     */
    async findByEventTypeCode(eventTypeCode: string): Promise<Events[]> {
        try {
            return await this.prisma.events.findMany({
                where: {
                    eventTypeCode: eventTypeCode,
                },
                include: {
                    eventType: true,
                },
                orderBy: {
                    startDate: "desc",
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findByEventTypeCode");
        }
    }

    /**
     * 新しいイベントを作成
     * @param eventData - イベント作成データ
     * @returns {Promise<Events>} 作成されたイベント
     */
    async create(eventData: {
        eventCode: string;
        eventTypeCode: string;
        eventName: string;
        startDate?: Date;
    }): Promise<Events> {
        try {
            return await this.prisma.events.create({
                data: eventData,
            });
        } catch (error) {
            this.handleDatabaseError(error, "create");
        }
    }

    /**
     * イベント情報を更新
     * @param eventCode - 更新対象のイベントコード
     * @param updateData - 更新データ
     * @returns {Promise<Events>} 更新されたイベント
     */
    async update(
        eventCode: string,
        updateData: {
            eventName?: string;
            startDate?: Date;
            eventTypeCode?: string;
        }
    ): Promise<Events> {
        try {
            return await this.prisma.events.update({
                where: {
                    eventCode: eventCode,
                },
                data: updateData,
            });
        } catch (error) {
            this.handleDatabaseError(error, "update");
        }
    }

    /**
     * イベントを削除
     * @param eventCode - 削除するイベントコード
     * @returns {Promise<Events>} 削除されたイベント
     */
    async delete(eventCode: string): Promise<Events> {
        try {
            return await this.prisma.events.delete({
                where: {
                    eventCode: eventCode,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "delete");
        }
    }

    /**
     * 開始日で範囲検索
     * @param startDate - 開始日の開始
     * @param endDate - 開始日の終了
     * @returns {Promise<Events[]>} イベントの配列
     */
    async findByDateRange(startDate: Date, endDate: Date): Promise<Events[]> {
        try {
            return await this.prisma.events.findMany({
                where: {
                    startDate: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                include: {
                    eventType: true,
                },
                orderBy: {
                    startDate: "asc",
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findByDateRange");
        }
    }
}
