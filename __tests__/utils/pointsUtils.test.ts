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
});
