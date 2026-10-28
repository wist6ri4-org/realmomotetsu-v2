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
}
