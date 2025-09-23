import { Points, PointStatus } from "@/generated/prisma";
import { BaseRepository } from "../base/BaseRepository";
import { SummedPoints } from "@/types/SummedPoints";

export class PointsRepository extends BaseRepository {
    /**
     * イベントコードでポイントを取得
     * @param eventCode - イベントコード
     * @return {Promise<Points[]>} ポイントの配列
     */
    async findByEventCode(eventCode: string): Promise<Points[]> {
        try {
            return (await this.prisma.points.findMany({
                where: {
                    eventCode: eventCode,
                },
                include: {
                    team: true, // チーム情報を含める
                    event: true, // イベント情報を含める
                },
                orderBy: {
                    createdAt: "desc",
                },
            })) as Points[];
        } catch (error) {
            this.handleDatabaseError(error, "findByEventCode");
        }
    }

    /**
     * チームコードでポイントを取得
     * @param teamCode - チームコード
     * @return {Promise<Points[]>} ポイントの配列
     */
    async findByTeamCode(teamCode: string): Promise<Points[]> {
        try {
            return (await this.prisma.points.findMany({
                where: {
                    teamCode: teamCode,
                },
                include: {
                    team: true, // チーム情報を含める
                    event: true, // イベント情報を含める
                },
                orderBy: {
                    createdAt: "desc",
                },
            })) as Points[];
        } catch (error) {
            this.handleDatabaseError(error, "findByTeamCode");
        }
    }

    /**
     * 指定されたチームコードごとのポイントを合計
     * @param teamCode - チームコード
     * @return {Promise<PointsGroupedByTeam[]>} チームコードごとの合計ポイント
     */
    async sumPointsGroupedByTeamCode(eventCode: string): Promise<SummedPoints[]> {
        try {
            const result = await this.prisma.points.groupBy({
                by: ["teamCode"],
                _sum: {
                    points: true,
                },
                where: {
                    status: "points", // ポイント状態のポイントのみを対象
                    eventCode: eventCode,
                },
            });
            return result.map((item) => ({
                teamCode: item.teamCode,
                totalPoints: item._sum.points || 0, // nullの場合は0にする
            })) as SummedPoints[];
        } catch (error) {
            this.handleDatabaseError(error, "sumGroupedByTeamCode");
        }
    }

    /**
     * 指定されたチームコードごとのスコアポイントを合計
     * @param teamCode - チームコード
     * @return {Promise<ScoredPointsGroupedByTeamCode[]>} チームコードごとの合計スコアポイント
     */
    async sumScoredPointsGroupedByTeamCode(eventCode: string): Promise<SummedPoints[]> {
        try {
            const result = await this.prisma.points.groupBy({
                by: ["teamCode"],
                _sum: {
                    points: true,
                },
                where: {
                    status: "scored", // スコア済みのポイントのみを対象
                    eventCode: eventCode,
                },
            });
            return result.map((item) => ({
                teamCode: item.teamCode,
                totalPoints: item._sum.points || 0, // nullの場合は0にする
            })) as SummedPoints[];
        } catch (error) {
            this.handleDatabaseError(error, "sumScoredPointsByTeamCode");
        }
    }

    /**
     * 新しいポイントを作成
     * @param eventCode - イベントコード
     * @param teamCode - チームコード
     * @param points - ポイント数
     * @return {Promise<Points>} 作成されたポイント
     */
    async create(
        eventCode: string,
        teamCode: string,
        points: number,
        status: PointStatus = "points"
    ): Promise<Points> {
        try {
            return await this.prisma.points.create({
                data: {
                    teamCode: teamCode,
                    eventCode: eventCode,
                    points: points,
                    status: status,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "create");
        }
    }

    /**
     * ポイントを更新
     * @param id - 更新対象のID
     * @param teamCode - チームコード
     * @param eventCode - イベントコード
     * @param points - 更新するポイント数
     * @return {Promise<Points>} 更新されたポイント
     */
    async update(id: number, teamCode: string, eventCode: string, points: number): Promise<Points> {
        try {
            return await this.prisma.points.update({
                where: {
                    id: id,
                },
                data: {
                    points: points,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "update");
        }
    }

    /**
     * チームコードに基づいてポイントのステータスを更新
     * @param teamCode - チームコード
     * @param status - 更新するステータス（デフォルトは"scored"）
     * @return {Promise<{ count: number }>} 更新されたレコード数
     */
    async updateStatusByTeamCode(
        teamCode: string,
        status: PointStatus = "scored"
    ): Promise<{ count: number }> {
        try {
            return await this.prisma.points.updateMany({
                where: {
                    teamCode: teamCode,
                    status: status === "scored" ? "points" : "scored", // スコア済みの場合はポイントからスコア済みに変更
                },
                data: {
                    status: status,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "updateStatusByTeamCode");
        }
    }

    /**
     * ポイントを削除
     * @param id - 削除対象のID
     * @return {Promise<Points>} 削除されたポイント
     */
    async delete(id: number): Promise<Points> {
        try {
            return await this.prisma.points.delete({
                where: {
                    id: id,
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "delete");
        }
    }
}
