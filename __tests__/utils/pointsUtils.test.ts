/**
 * @jest-environment node
 */

import { GameConstants } from "@/constants/gameConstants";
import { PointsUtils } from "@/utils/pointsUtils";
import { buildTeamData } from "../helpers/factories";

describe("PointsUtils", () => {
    describe("calculateTeamBalance", () => {
        const teamData = [
            buildTeamData({ teamCode: "TEAM_A", scoredPoints: 1_000, propertyPurchasePoints: -300 }),
            buildTeamData({ teamCode: "TEAM_B", scoredPoints: 500, propertyPurchasePoints: 0 }),
        ];

        it("持ち金はscoredPoints、資産は物件購入分の符号を反転した値になる", () => {
            expect(PointsUtils.calculateTeamBalance(teamData, "TEAM_A")).toEqual({ money: 1_000, asset: 300 });
        });

        it("該当チームが無い場合は0を返す", () => {
            expect(PointsUtils.calculateTeamBalance(teamData, "UNKNOWN")).toEqual({ money: 0, asset: 0 });
        });
    });

    describe("calculateTeamBalanceAfter", () => {
        const balance = { money: 1_000, asset: 300 };

        it.each([GameConstants.POINT_STATUS.SCORED, GameConstants.POINT_STATUS.REVENUE])(
            "%s で登録すると持ち金のみ増減する",
            (status) => {
                expect(PointsUtils.calculateTeamBalanceAfter(balance, 200, status)).toEqual({ money: 1_200, asset: 300 });
                expect(PointsUtils.calculateTeamBalanceAfter(balance, -200, status)).toEqual({ money: 800, asset: 300 });
            }
        );

        it("物件で登録すると持ち金が増え、資産が同額減る", () => {
            expect(
                PointsUtils.calculateTeamBalanceAfter(balance, 100, GameConstants.POINT_STATUS.PROPERTY)
            ).toEqual({ money: 1_100, asset: 200 });
        });

        it("物件で負のポイントを登録すると持ち金が減り、資産が同額増える", () => {
            expect(
                PointsUtils.calculateTeamBalanceAfter(balance, -100, GameConstants.POINT_STATUS.PROPERTY)
            ).toEqual({ money: 900, asset: 400 });
        });
    });

    describe("calculateTotalAssets", () => {
        it("持ち金に物件価値（物件購入分の符号反転）を足した値になる", () => {
            const team = buildTeamData({ scoredPoints: 1_000, propertyPurchasePoints: -300 });
            expect(PointsUtils.calculateTotalAssets(team)).toBe(1_300);
        });
    });

    describe("rankTeamsByTotalAssets", () => {
        it("総資産の降順に並び、順位が付く", () => {
            const result = PointsUtils.rankTeamsByTotalAssets([
                buildTeamData({ teamCode: "TEAM_A", scoredPoints: 100 }),
                buildTeamData({ teamCode: "TEAM_B", scoredPoints: 500, propertyPurchasePoints: -200 }),
                buildTeamData({ teamCode: "TEAM_C", scoredPoints: -50 }),
            ]);
            expect(result.map((r) => [r.rank, r.team.teamCode, r.totalAssets])).toEqual([
                [1, "TEAM_B", 700],
                [2, "TEAM_A", 100],
                [3, "TEAM_C", -50],
            ]);
        });

        it("同額は同順位になり、次の順位は人数分飛ぶ", () => {
            const result = PointsUtils.rankTeamsByTotalAssets([
                buildTeamData({ teamCode: "TEAM_A", scoredPoints: 300 }),
                buildTeamData({ teamCode: "TEAM_B", scoredPoints: 300 }),
                buildTeamData({ teamCode: "TEAM_C", scoredPoints: 100 }),
            ]);
            expect(result.map((r) => r.rank)).toEqual([1, 1, 3]);
        });

        it("空配列の場合は空配列を返す", () => {
            expect(PointsUtils.rankTeamsByTotalAssets([])).toEqual([]);
        });
    });
});
