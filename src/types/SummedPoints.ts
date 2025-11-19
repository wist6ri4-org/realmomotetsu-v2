import z from "zod";

/**
 * 合計ポイントの型定義
 * @property {string} teamCode - チームコード
 * @property {number} totalPoints - 合計ポイント
 */
export type SummedPoints = {
    teamCode: string;
    totalPoints: number;
};

// 合計ポイントのバリデーションスキーマ
export const summedPointsSchema = z.object({
    teamCode: z.string(),
    totalPoints: z.number(),
});
