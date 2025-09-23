import { TransitStationsWithRelations } from "@/repositories/transitStations/TransitStationsRepository";

/**
 * チームコードごとにグループ化された経由駅の型定義
 * @property {string} teamCode - チームコード
 * @property {TransitStationsWithRelations[]} transitStations - 接続駅の配列
 */
export type TransitStationsGroupedByTeamCode = {
    [teamCode: string]: TransitStationsWithRelations[];
};