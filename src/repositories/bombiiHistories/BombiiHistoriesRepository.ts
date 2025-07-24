import { BombiiHistories, Teams } from "@/generated/prisma";
import { BaseRepository } from "../base/BaseRepository";

// includeありのBombiiHistoriesの型定義
type BombiiHistoryWithTeam = BombiiHistories & {
    team: Teams;
};

/**
 * ボンビー履歴関連のデータアクセス処理を担当するRepository
 */
export class BombiiHistoriesRepository extends BaseRepository {
    /**
     * 指定されたイベントの現在のボンビーチームを取得
     * 最新のボンビー履歴からチームを取得
     * @param eventCode - イベントコード
     * @returns {Promise<BombiiHistoryWithTeam | null>} 現在のボンビー履歴またはnull
     */
    async findCurrentBombiiTeam(eventCode: string): Promise<BombiiHistoryWithTeam | null> {
        try {
            return (await this.prisma.bombiiHistories.findFirst({
                where: {
                    eventCode: eventCode,
                },
                include: {
                    team: true, // Teams情報も含める
                },
                orderBy: {
                    createdAt: "desc", // 最新のものを取得
                },
            })) as BombiiHistoryWithTeam | null;
        } catch (error) {
            this.handleDatabaseError(error, "findCurrentBombiiTeam");
        }
    }

    /**
     * 指定されたイベントのすべてのボンビー履歴を取得
     * @param eventCode - イベントコード
     * @returns {Promise<BombiiHistoryWithTeam[]>} ボンビー履歴の配列
     */
    async findByEventCode(eventCode: string): Promise<BombiiHistoryWithTeam[]> {
        try {
            return (await this.prisma.bombiiHistories.findMany({
                where: {
                    eventCode: eventCode,
                },
                include: {
                    team: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            })) as BombiiHistoryWithTeam[];
        } catch (error) {
            this.handleDatabaseError(error, "findByEventCode");
        }
    }

    /**
     * 新しいボンビー履歴を作成
     * @param teamCode - チームコード
     * @param eventCode - イベントコード
     * @returns {Promise<BombiiHistories>} 作成されたボンビー履歴
     */
    async create(bombiiHistoryData: {teamCode: string, eventCode: string}): Promise<BombiiHistories> {
        try {
            return await this.prisma.bombiiHistories.create({
                data: bombiiHistoryData,
            });
        } catch (error) {
            this.handleDatabaseError(error, "create");
        }
    }
}
