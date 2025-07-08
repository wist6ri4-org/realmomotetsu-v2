/**
 * チームコードごとにグループ化されたポイントの型定義
 * @property {string} teamCode - チームコード
 * @property {number} totalPoints - 合計ポイント
 */
export type SummedPoints = {
    teamCode: string;
    totalPoints: number;
};