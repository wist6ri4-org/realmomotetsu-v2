import { Points, PointStatus } from "@/generated/prisma";

/**
 * チームコードごとにグループ化されたポイントの型定義
 * @property {string} teamCode - チームコード
 * @property {PointStatus} status - ポイントのステータス
 * @property {Points[]} points - ポイントの配列
 */
export type PointsGroupedByTeamCode = {
    [teamCode: string]: {
        [K in PointStatus]: Points[];
    };
}
