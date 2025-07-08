import { Teams } from "@/generated/prisma";
import { BaseRepository } from "../base/BaseRepository";

/**
 * チーム関連のデータアクセス処理を担当するRepository
 */
export class TeamsRepository extends BaseRepository {
    /**
     * 指定されたイベントのすべてのチームを取得
     * @param eventCode - イベントコード
     * @returns {Promise<Teams[]>} チームの配列
     */
    async findByEventCode(eventCode: string): Promise<Teams[]> {
        try {
            return await this.prisma.teams.findMany({
                where: {
                    eventCode: eventCode,
                },
                orderBy: {
                    teamName: "asc",
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findByEventCode");
        }
    }

    /**
     * チームコードでチームを検索
     * @param teamCode - チームコード
     * @returns {Promise<Teams | null>} チーム情報またはnull
     */
    async findByTeamCode(teamCode: string): Promise<Teams | null> {
        try {
            return await this.prisma.teams.findUnique({
                where: {
                    teamCode: teamCode,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findByTeamCode");
        }
    }

    /**
     * 新しいチームを作成
     * @param teamData - チーム作成データ
     * @returns {Promise<Teams>} 作成されたチーム
     */
    async create(teamData: {
        teamCode: string;
        teamName: string;
        teamColor?: string;
        eventCode: string;
    }): Promise<Teams> {
        try {
            return await this.prisma.teams.create({
                data: teamData,
            });
        } catch (error) {
            this.handleDatabaseError(error, "create");
        }
    }

    /**
     * チーム情報を更新
     * @param teamCode - 更新対象のチームコード
     * @param updateData - 更新データ
     * @returns {Promise<Teams>} 更新されたチーム
     */
    async update(
        teamCode: string,
        updateData: {
            teamName?: string;
            teamColor?: string;
        }
    ): Promise<Teams> {
        try {
            return await this.prisma.teams.update({
                where: {
                    teamCode: teamCode,
                },
                data: updateData,
            });
        } catch (error) {
            this.handleDatabaseError(error, "update");
        }
    }

    /**
     * チームを削除
     * @param teamCode - 削除するチームコード
     * @returns {Promise<Teams>} 削除されたチーム
     */
    async delete(teamCode: string): Promise<Teams> {
        try {
            return await this.prisma.teams.delete({
                where: {
                    teamCode: teamCode,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "delete");
        }
    }
}
