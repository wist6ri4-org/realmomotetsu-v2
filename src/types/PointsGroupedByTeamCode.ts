import { Points, PointStatus } from "@/generated/prisma";
import { z } from "zod";
import { PointsSchema } from "@/generated/zod";

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
};

/**
 * PointsGroupedByTeamCodeのZodバリデーションスキーマ
 * 各チームコードは必須で、各ステータス（points/scored）も必須の配列として定義
 */
export const PointsGroupedByTeamCodeSchema = z.record(
    z.string(), // teamCode
    z.object({
        points: z.array(PointsSchema),
        scored: z.array(PointsSchema),
    })
);
