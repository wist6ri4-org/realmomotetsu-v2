import { Events, Points, Teams } from "@/generated/prisma";
import { BaseRepository } from "../base/BaseRepository";
import { SummedPoints } from "@/types/SummedPoints";

type PointsWithRelations = Points & {
    team: Teams;
    event: Events;
};

export class PointsRepository extends BaseRepository {
    /**
     * チームコードでポイントを取得
     * @param teamCode - チームコード
     * @return {Promise<PointsWithRelations[]>} ポイントの配列
     */
    async findByTeamCode(teamCode: string): Promise<PointsWithRelations[]> {
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
            })) as PointsWithRelations[] || null;
        } catch (error) {
            this.handleDatabaseError(error, "findByTeamCode");
        }
    }

    /**
     * 指定されたチームコードのポイントを合計
     * @param teamCode - チームコード
     * @return {Promise<PointsGroupedByTeam[]>} チームコードごとの合計ポイント
     */
    async sumPointsGroupedByTeamCode(teamCode: string): Promise<SummedPoints[]> {
        try {
            const result = await this.prisma.points.groupBy({
                by: ['teamCode'],
                _sum: {
                    points: true,
                },
                where: {
                    teamCode: teamCode,
                    status: "points", // ポイント状態のポイントのみを対象
                },
            });
            return result.map(item => ({
                teamCode: item.teamCode,
                totalPoints: item._sum.points || 0, // nullの場合は0にする
            })) as SummedPoints[];
        } catch (error) {
            this.handleDatabaseError(error, "sumGroupedByTeamCode");
        }
    }

    /**
     * 指定されたチームコードのスコアポイントを合計
     * @param teamCode - チームコード
     * @return {Promise<ScoredPointsGroupedByTeamCode[]>} チームコードごとの合計スコアポイント
     */
    async sumScoredPointsGroupedByTeamCode(teamCode: string): Promise<SummedPoints[]> {
        try {
            const result = await this.prisma.points.groupBy({
                by: ['teamCode'],
                _sum: {
                    points: true,
                },
                where: {
                    teamCode: teamCode,
                    status: 'scored', // スコア済みのポイントのみを対象
                },
            });
            return result.map(item => ({
                teamCode: item.teamCode,
                totalPoints: item._sum.points || 0, // nullの場合は0にする
            })) as SummedPoints[];
        } catch (error) {
            this.handleDatabaseError(error, "sumScoredPointsByTeamCode");
        }
    }
}