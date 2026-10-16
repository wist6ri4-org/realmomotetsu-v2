import { Attendances, Events, EventTypes } from "@/generated/prisma";
import { BaseRepository } from "../base/BaseRepository";

export type AttendancesWithRelations = Attendances & {
    event: Events & {
        eventType: EventTypes;
    };
};

export type AttendancesWithUserInformation = Attendances & {
    user: {
        uuid: string;
        nickname: string | null;
        iconUrl: string | null;
    };
};

/**
 * 参加情報関連のデータアクセス処理を担当するRepository
 */
export class AttendancesRepository extends BaseRepository {
    /**
     * イベントコードで参加者を取得
     * @param eventCode - イベントコード
     * @return {Promise<AttendancesWithUserInformation[]>} 参加者の配列
     */
    async findByEventCode(eventCode: string): Promise<AttendancesWithUserInformation[]> {
        try {
            return await this.prisma.attendances.findMany({
                where: {
                    eventCode: eventCode,
                },
                include: {
                    user: {
                        select: {
                            uuid: true,
                            nickname: true,
                            iconUrl: true,
                        }
                    },
                },
                orderBy: [
                    {
                        teamCode: "asc",
                    },
                    {
                        id: "asc",
                    },
                ],
            });
        } catch (error) {
            this.handleDatabaseError(error, "findByEventCode");
        }
    }
}
