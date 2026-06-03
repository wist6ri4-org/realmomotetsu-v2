import { Points, PointStatus } from "@/generated/prisma";
import { BaseRepository, PrismaTransactionClient } from "../base/BaseRepository";
import { SummedPoints } from "@/types/SummedPoints";
import { GameConstants } from "@/constants/gameConstants";

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
                    status: GameConstants.POINT_STATUS.POINTS, // ポイント状態のポイントのみを対象
                    eventCode: eventCode,
                },
            });
            return result.map((item) => ({
                teamCode: item.teamCode,
                totalPoints: item._sum.points || 0, // nullの場合は0にする
            })) as SummedPoints[];
        } catch (error) {
            this.handleDatabaseError(error, "sumPointsGroupedByTeamCode");
        }
    }

    /**
     * 指定されたイベントコードにおけるチームごとのスコアポイントを合計
     * @param eventCode - イベントコード
     * @return {Promise<SummedPoints[]>} チームごとの合計スコアポイント
     */
    async sumScoredPointsGroupedByTeamCode(eventCode: string): Promise<SummedPoints[]> {
        try {
            const result = await this.prisma.points.groupBy({
                by: ["teamCode"],
                _sum: {
                    points: true,
                },
                where: {
                    OR: [
                        { status: GameConstants.POINT_STATUS.SCORED }, // 総資産
                        { status: GameConstants.POINT_STATUS.PROPERTY }, // 物件
                        { status: GameConstants.POINT_STATUS.REVENUE }, // 収益
                    ],
                    eventCode: eventCode,
                },
            });
            return result.map((item) => ({
                teamCode: item.teamCode,
                totalPoints: item._sum.points || 0, // nullの場合は0にする
            })) as SummedPoints[];
        } catch (error) {
            this.handleDatabaseError(error, "sumScoredPointsGroupedByTeamCode");
        }
    }

    /**
     * 指定されたイベントコードにおけるチームごとの物件駅購入ポイントを合計
     * @param eventCode - イベントコード
     * @return {Promise<SummedPoints[]>} チームごとの合計ポイント
     */
    async sumPropertyPointsGroupedByTeamCode(eventCode: string): Promise<SummedPoints[]> {
        try {
            const result = await this.prisma.points.groupBy({
                by: ["teamCode"],
                _sum: {
                    points: true,
                },
                where: {
                    OR: [
                        { status: GameConstants.POINT_STATUS.PROPERTY }, // 物件
                    ],
                    eventCode: eventCode,
                },
            });
            return result.map((item) => ({
                teamCode: item.teamCode,
                totalPoints: item._sum.points || 0, // nullの場合は0にする
            })) as SummedPoints[];
        } catch (error) {
            this.handleDatabaseError(error, "sumPropertyPointsGroupedByTeamCode");
        }
    }

    /**
     * 指定されたイベントコードにおけるチームごとの物件駅購入ポイントを合計
     * @param eventCode - イベントコード
     * @return {Promise<SummedPoints[]>} チームごとの合計ポイント
     */
    async sumRevenuePointsGroupedByTeamCode(eventCode: string): Promise<SummedPoints[]> {
        try {
            const result = await this.prisma.points.groupBy({
                by: ["teamCode"],
                _sum: {
                    points: true,
                },
                where: {
                    OR: [
                        { status: GameConstants.POINT_STATUS.REVENUE }, // 収益
                    ],
                    eventCode: eventCode,
                },
            });
            return result.map((item) => ({
                teamCode: item.teamCode,
                totalPoints: item._sum.points || 0, // nullの場合は0にする
            })) as SummedPoints[];
        } catch (error) {
            this.handleDatabaseError(error, "sumRevenuePointsGroupedByTeamCode");
        }
    }

    /**
     * 指定されたチームコードのスコアポイントを合計
     * @param teamCode - チームコード
     * @param eventCode - イベントコード
     * @param tx - トランザクションクライアント（オプション）
     * @return {Promise<number>} 合計スコアポイント
     */
    async sumScoredPointsByTeamCode(
        teamCode: string,
        eventCode: string,
        tx?: PrismaTransactionClient,
    ): Promise<number> {
        const client = tx ?? this.prisma;
        try {
            const result = await client.points.aggregate({
                _sum: {
                    points: true,
                },
                where: {
                    teamCode: teamCode,
                    eventCode: eventCode,
                    OR: [
                        { status: GameConstants.POINT_STATUS.SCORED },
                        { status: GameConstants.POINT_STATUS.PROPERTY },
                        { status: GameConstants.POINT_STATUS.REVENUE }, // 収益
                    ],
                },
            });
            return result._sum.points || 0; // nullの場合は0にする
        } catch (error) {
            this.handleDatabaseError(error, "sumScoredPointsByTeamCode");
        }
    }

    /**
     * 新しいポイントを作成
     * @param eventCode - イベントコード
     * @param teamCode - チームコード
     * @param points - ポイント数
     * @param status - ポイントのステータス（デフォルトは"points"）
     * @param tx - トランザクションクライアント（オプション）
     * @return {Promise<Points>} 作成されたポイント
     */
    async create(
        eventCode: string,
        teamCode: string,
        points: number,
        status: PointStatus = GameConstants.POINT_STATUS.POINTS,
        tx?: PrismaTransactionClient,
    ): Promise<Points> {
        const client = tx ?? this.prisma;
        try {
            return await client.points.create({
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
        status: PointStatus = GameConstants.POINT_STATUS.SCORED,
    ): Promise<{ count: number }> {
        try {
            return await this.prisma.points.updateMany({
                where: {
                    teamCode: teamCode,
                    status:
                        status === GameConstants.POINT_STATUS.SCORED
                            ? GameConstants.POINT_STATUS.POINTS
                            : GameConstants.POINT_STATUS.SCORED, // スコア済みの場合はポイントからスコア済みに変更
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
