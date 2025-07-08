import { TransitStations } from "@/generated/prisma/client";

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
 */
export type TeamData = {
    id: number;
    teamCode: string;
    teamName: string;
    teamColor: string;
    transitStations: TransitStations[];
    remainingStationsNumber: number;
    points: number;
    scoredPoints: number;
};
