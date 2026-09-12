/**
 * @jest-environment node
 */

import { GameConstants } from "@/constants/gameConstants";
import { GameLogicUtils } from "@/utils/gameLogicUtils";
import { buildBidirectionalNearbyStations, buildTeamData } from "../helpers/factories";

describe("GameLogicUtils", () => {
    describe("confirmBombii", () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        it("目的駅から最も遠い（残り駅数が最大の）チームがボンビーになる", () => {
            const teams = [
                buildTeamData({ teamCode: "TEAM_A", remainingStationsNumber: 3 }),
                buildTeamData({ teamCode: "TEAM_B", remainingStationsNumber: 8 }),
                buildTeamData({ teamCode: "TEAM_C", remainingStationsNumber: 5 }),
            ];

            expect(GameLogicUtils.confirmBombii(teams).teamCode).toBe("TEAM_B");
        });

        it("残り駅数が同じ場合は総資産が多いチームがボンビーになる", () => {
            const teams = [
                buildTeamData({ teamCode: "TEAM_A", remainingStationsNumber: 5, scoredPoints: 1000 }),
                buildTeamData({ teamCode: "TEAM_B", remainingStationsNumber: 5, scoredPoints: 9000 }),
            ];

            expect(GameLogicUtils.confirmBombii(teams).teamCode).toBe("TEAM_B");
        });

        it("残り駅数も総資産も同じ場合は候補からランダムに1チームが選ばれる", () => {
            const teams = [
                buildTeamData({ teamCode: "TEAM_A", remainingStationsNumber: 5, scoredPoints: 1000 }),
                buildTeamData({ teamCode: "TEAM_B", remainingStationsNumber: 5, scoredPoints: 1000 }),
            ];

            // Math.randomの戻り値でどの候補が選ばれるかが決まるため、両端を固定して検証する
            jest.spyOn(Math, "random").mockReturnValue(0);
            expect(GameLogicUtils.confirmBombii(teams).teamCode).toBe("TEAM_A");

            jest.spyOn(Math, "random").mockReturnValue(0.99);
            expect(GameLogicUtils.confirmBombii(teams).teamCode).toBe("TEAM_B");
        });

        it("残り駅数が同点でも総資産で決着がつく場合は候補が1チームに絞られる", () => {
            const teams = [
                buildTeamData({ teamCode: "TEAM_A", remainingStationsNumber: 5, scoredPoints: 1000 }),
                buildTeamData({ teamCode: "TEAM_B", remainingStationsNumber: 5, scoredPoints: 1000 }),
                buildTeamData({ teamCode: "TEAM_C", remainingStationsNumber: 5, scoredPoints: 5000 }),
            ];

            // 同点候補が残っていても、より総資産の多いTEAM_Cが候補を置き換える
            jest.spyOn(Math, "random").mockReturnValue(0.99);
            expect(GameLogicUtils.confirmBombii(teams).teamCode).toBe("TEAM_C");
        });

        it("チームが1つの場合はそのチームが返る", () => {
            const teams = [buildTeamData({ teamCode: "TEAM_A", remainingStationsNumber: 0 })];

            expect(GameLogicUtils.confirmBombii(teams).teamCode).toBe("TEAM_A");
        });
    });

    describe("calculateArrivalPrizeV3", () => {
        // A --5分-- B --5分-- C --5分-- D の直線路線
        const nearbyStations = buildBidirectionalNearbyStations([
            ["STATION_A", "STATION_B", 5],
            ["STATION_B", "STATION_C", 5],
            ["STATION_C", "STATION_D", 5],
        ]);

        it("基本賞金に「駅数×駅数ごとの増加額」を加算した額が返る", () => {
            const prize = GameLogicUtils.calculateArrivalPrizeV3(nearbyStations, "STATION_A", "STATION_D");

            // A→Dは3駅
            expect(prize).toBe(
                GameConstants.ARRIVAL_PRIZE_V3.BASIC_PRIZE +
                    3 * GameConstants.ARRIVAL_PRIZE_V3.INCREMENT_PER_STATION_NUMBER,
            );
        });

        it("出発駅と到着駅が同じ場合は基本賞金のみが返る", () => {
            const prize = GameLogicUtils.calculateArrivalPrizeV3(nearbyStations, "STATION_A", "STATION_A");

            expect(prize).toBe(GameConstants.ARRIVAL_PRIZE_V3.BASIC_PRIZE);
        });

        it("到着駅が路線に存在しない場合は基本賞金のみが返る", () => {
            const prize = GameLogicUtils.calculateArrivalPrizeV3(nearbyStations, "STATION_A", "STATION_UNKNOWN");

            expect(prize).toBe(GameConstants.ARRIVAL_PRIZE_V3.BASIC_PRIZE);
        });
    });

    describe("calculateConsecutiveGoalBonusV3", () => {
        // 連続ゴール数の境界（1以下はボーナスなし）を誤るとボーナスが過剰／過少になるため、境界値を厚めに検証する
        it.each([
            [0, 0],
            [1, 0],
        ])("連続ゴール数が%i回のときはボーナスなし", (consecutiveGoalCount, expected) => {
            expect(GameLogicUtils.calculateConsecutiveGoalBonusV3(consecutiveGoalCount)).toBe(expected);
        });

        it.each([[2], [3], [5]])("連続ゴール数が%i回のときは「(連続ゴール数+1)×単価」が返る", (count) => {
            expect(GameLogicUtils.calculateConsecutiveGoalBonusV3(count)).toBe(
                GameConstants.CONSECUTIVE_GOAL_BONUS_PER_STATION_NUMBER * (count + 1),
            );
        });

        it("連続ゴール数が増えるとボーナスは単調増加する", () => {
            const bonuses = [1, 2, 3, 4, 5].map((count) => GameLogicUtils.calculateConsecutiveGoalBonusV3(count));

            bonuses.forEach((bonus, index) => {
                if (index > 0) {
                    expect(bonus).toBeGreaterThan(bonuses[index - 1]);
                }
            });
        });
    });
});
