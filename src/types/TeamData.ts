import { StationsSchema, TransitStationsSchema } from "@/generated/zod";
import { TransitStationsWithRelations } from "@/repositories/transitStations/TransitStationsRepository";
import z from "zod";

/**
 * チームデータの型定義
 * @property {number} id - チームのID
 * @property {string} teamCode - チームコード
 * @property {string} teamName - チーム名
 * @property {string} teamColor - チームカラー
 * @property {TransitStations[]} transitStations - チームの接続駅の配列
 * @property {number} remainingStationsNumber - 残りの駅数
 * @property {number} points - ポイント
 * @property {number} scoredPoints - 得点済みポイント
 * @property {number} bombiiCounts - ボンビーの回数
 */
export type TeamData = {
    id: number;
    teamCode: string;
    teamName: string;
    teamColor: string;
    transitStations: TransitStationsWithRelations[];
    remainingStationsNumber: number;
    points: number;
    scoredPoints: number;
    bombiiCounts: number;
};

// チームデータのバリデーションスキーマ
export const TeamDataSchema = z.object({
    id: z.number(),
    teamCode: z.string(),
    teamName: z.string(),
    teamColor: z.string(),
    transitStations: TransitStationsSchema.extend({
        station: StationsSchema,
    }).array(),
    remainingStationsNumber: z.number(),
    points: z.number(),
    scoredPoints: z.number(),
    bombiiCounts: z.number(),
});
