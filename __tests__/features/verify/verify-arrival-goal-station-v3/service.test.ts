/**
 * @jest-environment node
 */

import { GameConstants } from "@/constants/gameConstants";
import { BadRequestError, ConflictError, DataIntegrityError, InternalServerError } from "@/error";
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
    buildPropertyPurchaseWithRelations,
    buildTransitStation,
} from "../../../helpers/factories";
import { captureError, mockRepositories } from "../../../helpers/repositoryMocks";

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

/** 最新の目的駅の購入価格（グレードA） */
const PRICE = GameConstants.STATION_GRADE.a.price;

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
    willPurchase: false,
    ...overrides,
});

describe("VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findLatestGoalStation: jest.Mock;
    let findPreviousGoalStation: jest.Mock;
    let findByEventTypeCode: jest.Mock;
    let findGoalStationsByEventCode: jest.Mock;
    let findLatestByTeamCode: jest.Mock;
    let findByEventCodeAndStationCode: jest.Mock;
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
        findByEventCodeAndStationCode = jest.fn().mockResolvedValue(null);
        sumScoredPointsByTeamCode = jest.fn().mockResolvedValue(100_000);

        mockRepositories({
            goalStations: { findLatestGoalStation, findPreviousGoalStation },
            nearbyStations: { findByEventTypeCode },
            transitStations: { findGoalStationsByEventCode, findLatestByTeamCode },
            propertyPurchases: { findByEventCodeAndStationCode },
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

    describe("E01: 購入済みチェック", () => {
        it("購入希望かつ購入済みの場合はConflictErrorになる", async () => {
            findByEventCodeAndStationCode.mockResolvedValue(
                buildPropertyPurchaseWithRelations({ teamCode: OTHER_TEAM, stationCode: LATEST_GOAL }),
            );

            const error = await captureError(
                VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3(
                    buildRequest({ willPurchase: true }),
                ),
            );

            expect(error).toBeInstanceOf(ConflictError);
            expect(error).toHaveProperty(
                "errorCode",
                VerifyArrivalGoalStationV3Result.E01_ALREADY_PURCHASED,
            );
        });

        it("購入を希望しない場合は購入済みでもエラーにならない", async () => {
            findByEventCodeAndStationCode.mockResolvedValue(
                buildPropertyPurchaseWithRelations({ teamCode: OTHER_TEAM, stationCode: LATEST_GOAL }),
            );

            const res = await VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3(
                buildRequest({ willPurchase: false }),
            );

            expect(res.result).toBe(VerifyArrivalGoalStationV3Result.VERIFIED);
        });
    });

    describe("E02: ポイント不足チェック", () => {
        it("到着ポイントを加えても購入価格に届かない場合はBadRequestErrorになる", async () => {
            // 所持ポイント + 到着ポイント - 購入価格 が1円分だけ不足する状態
            sumScoredPointsByTeamCode.mockResolvedValue(PRICE - ARRIVAL_POINTS - 1);

            const error = await captureError(
                VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3(
                    buildRequest({ willPurchase: true }),
                ),
            );

            expect(error).toBeInstanceOf(BadRequestError);
            expect(error).toHaveProperty(
                "errorCode",
                VerifyArrivalGoalStationV3Result.E02_INSUFFICIENT_POINTS,
            );
        });

        it("購入後の残高がちょうど0になる場合は購入できる", async () => {
            sumScoredPointsByTeamCode.mockResolvedValue(PRICE - ARRIVAL_POINTS);

            const res = await VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3(
                buildRequest({ willPurchase: true }),
            );

            expect(res.result).toBe(VerifyArrivalGoalStationV3Result.VERIFIED);
        });

        // TSK-86の回帰テスト: 事前チェックに連続ゴールボーナスが含まれていなかった不具合の再発防止
        it("連続ゴールボーナスを加味して購入可否を判定する", async () => {
            // 直前のゴールも自チーム（＝連続ゴール2回目）
            findGoalStationsByEventCode.mockResolvedValue([
                buildTransitStation({ id: 2, teamCode: OWN_TEAM, isGoal: true }),
                buildTransitStation({ id: 1, teamCode: OTHER_TEAM, isGoal: true }),
            ]);
            const bonus = GameConstants.CONSECUTIVE_GOAL_BONUS_PER_STATION_NUMBER * 3; // 連続2回 → (2+1)×単価

            // ボーナスを加味しなければ不足するが、加味すればちょうど購入できる所持ポイント
            sumScoredPointsByTeamCode.mockResolvedValue(PRICE - ARRIVAL_POINTS - bonus);

            const res = await VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3(
                buildRequest({ willPurchase: true }),
            );

            expect(res.result).toBe(VerifyArrivalGoalStationV3Result.VERIFIED);
        });

        it("購入を希望しない場合はポイントが足りなくてもエラーにならない", async () => {
            sumScoredPointsByTeamCode.mockResolvedValue(0);

            const res = await VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3(
                buildRequest({ willPurchase: false }),
            );

            expect(res.result).toBe(VerifyArrivalGoalStationV3Result.VERIFIED);
        });

        it("目的駅のグレードが未設定の場合は購入価格0として扱われる", async () => {
            findLatestGoalStation.mockResolvedValue(
                buildGoalStation({ stationCode: LATEST_GOAL }, { stationGrade: null }),
            );
            sumScoredPointsByTeamCode.mockResolvedValue(0);

            const res = await VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3(
                buildRequest({ willPurchase: true }),
            );

            expect(res.result).toBe(VerifyArrivalGoalStationV3Result.VERIFIED);
        });
    });

    describe("連続ゴール数の数え方", () => {
        /**
         * ゴール履歴から算出される連続ゴールボーナス額を、購入可否の境界から逆算して検証する
         * @description ボーナスはレスポンスに含まれないため、購入価格ちょうど／1ポイント不足の2点を
         *              突き合わせることでボーナス額を一意に特定する。
         *              片側だけの検証ではボーナスが過大に計算されていても通ってしまうため、必ず両側を確認する。
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

            // ボーナスがちょうど不足分を埋めるため購入できる
            sumScoredPointsByTeamCode.mockResolvedValue(PRICE - ARRIVAL_POINTS - expectedBonus);
            const verified = await VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3(
                buildRequest({ willPurchase: true }),
            );
            expect(verified.result).toBe(VerifyArrivalGoalStationV3Result.VERIFIED);

            // 1ポイント不足するとエラーになる（＝ボーナスがこれ以上大きく計算されていないことの確認）
            sumScoredPointsByTeamCode.mockResolvedValue(PRICE - ARRIVAL_POINTS - expectedBonus - 1);
            const error = await captureError(
                VerifyArrivalGoalStationV3ServiceImpl.postVerifyArrivalGoalStationV3(
                    buildRequest({ willPurchase: true }),
                ),
            );
            expect(error).toHaveProperty(
                "errorCode",
                VerifyArrivalGoalStationV3Result.E02_INSUFFICIENT_POINTS,
            );
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
