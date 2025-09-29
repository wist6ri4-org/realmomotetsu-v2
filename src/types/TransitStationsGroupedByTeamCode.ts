import { TransitStationsSchema, StationsSchema } from "@/generated/zod";
import { TransitStationsWithRelations } from "@/repositories/transitStations/TransitStationsRepository";
import z from "zod";

/**
 * チームコードごとにグループ化された経由駅の型定義
 * @property {string} teamCode - チームコード
 * @property {TransitStationsWithRelations[]} transitStations - 接続駅の配列
 */
export type TransitStationsGroupedByTeamCode = {
    [teamCode: string]: TransitStationsWithRelations[];
};

// チームコードごとにグループ化された経由駅のバリデーションスキーマ
export const transitStationsGroupedByTeamCodeSchema = z.record(
    z.string(), // teamCode
    z.array(
        TransitStationsSchema.extend({
            station: StationsSchema,
        })
    )
);
