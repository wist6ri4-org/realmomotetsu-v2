/**
 * @jest-environment node
 */

import { GameConstants } from "@/constants/gameConstants";
import { DataIntegrityError, InternalServerError } from "@/error";
import { VerifyArrivalGoalStationV3ServiceImpl } from "@/features/verify/verify-arrival-goal-station-v3/service";
import {
    PostVerifyArrivalGoalStationV3Request,
    VerifyArrivalGoalStationV3Result,
} from "@/features/verify/verify-arrival-goal-station-v3/types";
import { StationGrade } from "@/generated/prisma";
import {
    TEST_EVENT_CODE,
    TEST_EVENT_TYPE_CODE,
    buildBidirectionalNearbyStations,
    buildGoalStation,
    buildLatestTransitStation,
    buildTransitStation,
} from "../../../helpers/factories";
import { mockRepositories } from "../../../helpers/repositoryMocks";

/** 検証対象のチーム */
const OWN_TEAM = "TEAM_A";
/** 別のチーム */
const OTHER_TEAM = "TEAM_B";

/** 1つ前の目的駅 */
const PREVIOUS_GOAL = "STATION_P";
/** 最新の目的駅 */
const LATEST_GOAL = "STATION_G";

/** PREVIOUS_GOAL --10分-- STATION_M --10分-- LATEST_GOAL の直線路線（＝2駅分） */
const NEARBY_STATIONS = buildBidirectionalNearbyStations([
    [PREVIOUS_GOAL, "STATION_M", 10],
    ["STATION_M", LATEST_GOAL, 10],
]);

/** 上記路線での到着ポイント（基本賞金 + 2駅分） */
const ARRIVAL_POINTS =
    GameConstants.ARRIVAL_PRIZE_V3.BASIC_PRIZE + 2 * GameConstants.ARRIVAL_PRIZE_V3.INCREMENT_PER_STATION_NUMBER;

/**
 * リクエストを組み立てる
 * @param {Partial<PostVerifyArrivalGoalStationV3Request>} overrides - 上書きする項目
 * @return {PostVerifyArrivalGoalStationV3Request} リクエスト
 */
const buildRequest = (
    overrides: Partial<PostVerifyArrivalGoalStationV3Request> = {},
): PostVerifyArrivalGoalStationV3Request => ({
    eventTypeCode: TEST_EVENT_TYPE_CODE,
    eventCode: TEST_EVENT_CODE,
    teamCode: OWN_TEAM,
    ...overrides,
});

describe("VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findLatestGoalStation: jest.Mock;
    let findPreviousGoalStation: jest.Mock;
    let findByEventTypeCode: jest.Mock;
    let findGoalStationsByEventCode: jest.Mock;
    let findLatestByTeamCode: jest.Mock;
    let sumScoredPointsByTeamCode: jest.Mock;

    beforeEach(() => {
        findLatestGoalStation = jest
            .fn()
            .mockResolvedValue(
                buildGoalStation({ stationCode: LATEST_GOAL }, { stationGrade: StationGrade.a }),
            );
        findPreviousGoalStation = jest.fn().mockResolvedValue(buildGoalStation({ stationCode: PREVIOUS_GOAL }));
        findByEventTypeCode = jest.fn().mockResolvedValue(NEARBY_STATIONS);
        // 直前のゴールは別チーム（＝連続ゴールなし）を既定とする
        findGoalStationsByEventCode = jest
            .fn()
            .mockResolvedValue([buildTransitStation({ id: 1, teamCode: OTHER_TEAM, isGoal: true })]);
        // 最新の経由駅が最新の目的駅と一致している状態を既定とする
        findLatestByTeamCode = jest
            .fn()
            .mockResolvedValue(buildLatestTransitStation({ teamCode: OWN_TEAM, stationCode: LATEST_GOAL }));
        sumScoredPointsByTeamCode = jest.fn().mockResolvedValue(100_000);

        mockRepositories({
            goalStations: { findLatestGoalStation, findPreviousGoalStation },
            nearbyStations: { findByEventTypeCode },
            transitStations: { findGoalStationsByEventCode, findLatestByTeamCode },
            points: { sumScoredPointsByTeamCode },
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("正常系", () => {
        it("最新の経由駅が目的駅と一致していればVERIFIEDを返す", async () => {
            const res = await VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3(
                buildRequest(),
            );

            expect(res.result).toBe(VerifyArrivalGoalStationV3Result.VERIFIED);
        });

        it("確認ダイアログ表示用に駅名・現在の持ち金・到着ポイント・連続ゴールボーナスを返す", async () => {
            const res = await VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3(
                buildRequest(),
            );

            expect(res).toEqual({
                result: VerifyArrivalGoalStationV3Result.VERIFIED,
                stationName: expect.any(String),
                currentPoints: 100_000,
                arrivalPoints: ARRIVAL_POINTS,
                consecutiveGoalBonus: 0,
            });
        });

        // 物件駅の購入は駅ミッション成功時に行うため、所持金が0でも到着処理は行える
        it("所持金が0でもエラーにならない", async () => {
            sumScoredPointsByTeamCode.mockResolvedValue(0);

            const res = await VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3(
                buildRequest(),
            );

            expect(res.result).toBe(VerifyArrivalGoalStationV3Result.VERIFIED);
        });

        it("最新の経由駅が目的駅と一致しない場合はW01_STATION_MISMATCHを返す", async () => {
            findLatestByTeamCode.mockResolvedValue(
                buildLatestTransitStation({ teamCode: OWN_TEAM, stationCode: "STATION_M" }),
            );

            const res = await VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3(
                buildRequest(),
            );

            expect(res.result).toBe(VerifyArrivalGoalStationV3Result.W01_STATION_MISMATCH);
        });

        it("経由駅が1件も登録されていない場合もW01_STATION_MISMATCHを返す", async () => {
            findLatestByTeamCode.mockResolvedValue(null);

            const res = await VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3(
                buildRequest(),
            );

            expect(res.result).toBe(VerifyArrivalGoalStationV3Result.W01_STATION_MISMATCH);
        });
    });

    describe("連続ゴール数の数え方", () => {
        /**
         * ゴール履歴から算出される連続ゴールボーナス額を検証する
         * @param {string[]} goalTeamCodes - ゴール履歴のチームコード（新しい順）
         * @param {number} expectedBonus - 期待する連続ゴールボーナス額
         */
        const expectConsecutiveGoalBonus = async (
            goalTeamCodes: string[],
            expectedBonus: number,
        ): Promise<void> => {
            findGoalStationsByEventCode.mockResolvedValue(
                goalTeamCodes.map((teamCode, index) =>
                    buildTransitStation({ id: 100 - index, teamCode, isGoal: true }),
                ),
            );

            const res = await VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3(
                buildRequest(),
            );
            expect(res.consecutiveGoalBonus).toBe(expectedBonus);
        };

        /** 連続ゴールn回分のボーナス額 */
        const bonusOf = (consecutiveGoalCount: number): number =>
            consecutiveGoalCount <= 1
                ? 0
                : GameConstants.CONSECUTIVE_GOAL_BONUS_PER_STATION_NUMBER * (consecutiveGoalCount + 1);

        it("ゴール履歴がない場合はボーナスなし（連続1回目）として扱われる", async () => {
            await expectConsecutiveGoalBonus([], bonusOf(1));
        });

        it("直前のゴールが別チームの場合はボーナスなし（連続1回目）として扱われる", async () => {
            await expectConsecutiveGoalBonus([OTHER_TEAM], bonusOf(1));
        });

        it("直前1件が自チームの場合は連続2回目として扱われる", async () => {
            await expectConsecutiveGoalBonus([OWN_TEAM, OTHER_TEAM], bonusOf(2));
        });

        it("直前2件が自チームの場合は連続3回目として扱われる", async () => {
            await expectConsecutiveGoalBonus([OWN_TEAM, OWN_TEAM, OTHER_TEAM], bonusOf(3));
        });

        it("別チームのゴールを挟んだ場合はそこで数えるのを止める", async () => {
            // 新しい順に 自チーム → 別チーム → 自チーム。連続とみなすのは直近の1件のみ
            await expectConsecutiveGoalBonus([OWN_TEAM, OTHER_TEAM, OWN_TEAM], bonusOf(2));
        });
    });

    describe("エラーハンドリング", () => {
        it("1つ前の目的駅が存在しない場合はDataIntegrityErrorになる", async () => {
            findPreviousGoalStation.mockResolvedValue(null);

            await expect(
                VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3(buildRequest()),
            ).rejects.toThrow(DataIntegrityError);
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            findLatestGoalStation.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3(buildRequest()),
            ).rejects.toThrow(InternalServerError);
        });
    });
});
