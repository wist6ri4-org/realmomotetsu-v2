import { GameConstants } from "@/constants/gameConstants";
import { PointStatus } from "@/generated/prisma";
import { TeamData } from "@/types/TeamData";

/**
 * チームの持ち金・資産の型定義
 * @property {number} money - 持ち金（持ち金・物件・収益の合計）
 * @property {number} asset - 資産（物件購入分。正の値で表す）
 */
export type TeamBalance = {
    money: number;
    asset: number;
};

/**
 * 総資産順位の型定義
 * @property {number} rank - 順位（同額は同順位）
 * @property {TeamData} team - チームデータ
 * @property {number} totalAssets - 総資産
 */
export type RankedTeam = {
    rank: number;
    team: TeamData;
    totalAssets: number;
};

export class PointsUtils {
    /**
     * チームの現在の持ち金・資産を取得する
     * @param {TeamData[]} teamData - チームデータのリスト
     * @param {string} teamCode - チームコード
     * @return {TeamBalance} 現在の持ち金・資産
     */
    static calculateTeamBalance(teamData: TeamData[], teamCode: string): TeamBalance {
        const team = teamData.find((t) => t.teamCode === teamCode);
        return {
            money: team?.scoredPoints ?? 0,
            // 物件購入分は負の値で記録されているため符号を反転する（-0 にならないよう減算で反転）
            asset: 0 - (team?.propertyPurchasePoints ?? 0),
        };
    }

    /**
     * ポイント追加後の持ち金・資産を計算する
     * @param {TeamBalance} balance - 現在の持ち金・資産
     * @param {number} points - 追加するポイント（減算する場合は負の値）
     * @param {PointStatus} status - ポイント状態
     * @return {TeamBalance} 追加後の持ち金・資産
     */
    static calculateTeamBalanceAfter(balance: TeamBalance, points: number, status: PointStatus): TeamBalance {
        return {
            // 持ち金は持ち金・物件・収益すべての合計のため、どの状態でも加算される
            money: balance.money + points,
            asset: status === GameConstants.POINT_STATUS.PROPERTY ? balance.asset - points : balance.asset,
        };
    }

    /**
     * チームの総資産を計算する
     * 持ち金には物件購入額（マイナス）が含まれているため、物件価値を足し戻して総資産とする
     * @param {TeamData} team - チームデータ
     * @return {number} 総資産（持ち金・収益・物件価値の合計）
     */
    static calculateTotalAssets(team: TeamData): number {
        return team.scoredPoints - team.propertyPurchasePoints;
    }

    /**
     * チームを総資産の降順に並べて順位を付ける（同額は同順位、次の順位は人数分飛ばす）
     * @param {TeamData[]} teamData - チームデータのリスト
     * @return {RankedTeam[]} 順位付きのチームのリスト
     */
    static rankTeamsByTotalAssets(teamData: TeamData[]): RankedTeam[] {
        const sorted = teamData
            .map((team) => ({ team, totalAssets: PointsUtils.calculateTotalAssets(team) }))
            .sort((a, b) => b.totalAssets - a.totalAssets);

        return sorted.map((item) => ({
            ...item,
            rank: sorted.findIndex((other) => other.totalAssets === item.totalAssets) + 1,
        }));
    }
}
