/**
 * @jest-environment node
 */

import { GameConstants } from "@/constants/gameConstants";
import { ConflictError, DataIntegrityError, InternalServerError } from "@/error";
import { ArrivalGoalStationV3ServiceImpl } from "@/features/arrival-goal-station-v3/service";
import { PostArrivalGoalStationV3Request } from "@/features/arrival-goal-station-v3/types";
import { PointStatus, StationGrade } from "@/generated/prisma";
import {
    TEST_EVENT_CODE,
    TEST_EVENT_TYPE_CODE,
    buildBidirectionalNearbyStations,
    buildGoalStation,
    buildLatestTransitStation,
    buildPoints,
    buildPropertyPurchase,
    buildTransitStation,
} from "../../helpers/factories";
import { captureError, mockRepositories, mockWithTransaction } from "../../helpers/repositoryMocks";

/** 到着処理を行うチーム */
const OWN_TEAM = "TEAM_A";
/** 別のチーム */
const OTHER_TEAM = "TEAM_B";

/** 1つ前の目的駅 */
const PREVIOUS_GOAL = "STATION_P";
/** 最新の目的駅 */
const LATEST_GOAL = "STATION_G";

/** 最新の経由駅のID（ゴール判定フラグの更新対象） */
const LATEST_TRANSIT_ID = 42;

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
 * @param {Partial<PostArrivalGoalStationV3Request>} overrides - 上書きする項目
 * @return {PostArrivalGoalStationV3Request} リクエスト
 */
const buildRequest = (
    overrides: Partial<PostArrivalGoalStationV3Request> = {},
): PostArrivalGoalStationV3Request => ({
    eventTypeCode: TEST_EVENT_TYPE_CODE,
    eventCode: TEST_EVENT_CODE,
    teamCode: OWN_TEAM,
    stations: [],
    ...overrides,
});

describe("ArrivalGoalStationV3ServiceImpl.postArrivalGoalStationV3", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findLatestGoalStation: jest.Mock;
    let findPreviousGoalStation: jest.Mock;
    let findByEventTypeCode: jest.Mock;
    let findGoalStationsByEventCode: jest.Mock;
    let findLatestByTeamCode: jest.Mock;
    let transitStationsUpdate: jest.Mock;
    let findByEventCodeAndStationCode: jest.Mock;
    let propertyPurchasesCreate: jest.Mock;
    let pointsCreate: jest.Mock;
    let sumScoredPointsByTeamCode: jest.Mock;
    /** withTransactionのコールバックに渡されるダミーのトランザクションクライアント */
    let tx: unknown;

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
        findLatestByTeamCode = jest
            .fn()
            .mockResolvedValue(
                buildLatestTransitStation({
                    id: LATEST_TRANSIT_ID,
                    teamCode: OWN_TEAM,
                    stationCode: LATEST_GOAL,
                }),
            );
        transitStationsUpdate = jest.fn().mockResolvedValue(buildTransitStation({ isGoal: true }));
        findByEventCodeAndStationCode = jest.fn().mockResolvedValue(null);
        propertyPurchasesCreate = jest
            .fn()
            .mockImplementation(async (data) => buildPropertyPurchase({ ...data, id: 7 }));
        pointsCreate = jest.fn().mockImplementation(async (eventCode, teamCode, points, status) =>
            buildPoints({ eventCode, teamCode, points, status }),
        );
        sumScoredPointsByTeamCode = jest.fn().mockResolvedValue(1_000_000);

        mockRepositories({
            goalStations: { findLatestGoalStation, findPreviousGoalStation },
            nearbyStations: { findByEventTypeCode },
            transitStations: {
                findGoalStationsByEventCode,
                findLatestByTeamCode,
                update: transitStationsUpdate,
            },
            propertyPurchases: {
                findByEventCodeAndStationCode,
                create: propertyPurchasesCreate,
            },
            points: { create: pointsCreate, sumScoredPointsByTeamCode },
        });
        tx = mockWithTransaction();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("到着ポイントの加算", () => {
        it("1つ前の目的駅からの駅数に応じた到着ポイントを総資産として登録する", async () => {
            const res = await ArrivalGoalStationV3ServiceImpl.postArrivalGoalStationV3(buildRequest());

            expect(pointsCreate).toHaveBeenCalledWith(
                TEST_EVENT_CODE,
                OWN_TEAM,
                ARRIVAL_POINTS,
                GameConstants.POINT_STATUS.SCORED,
                tx,
            );
            expect(res.points).toBe(ARRIVAL_POINTS);
        });

        it("経由駅のゴール判定フラグをtrueに更新する", async () => {
            await ArrivalGoalStationV3ServiceImpl.postArrivalGoalStationV3(buildRequest());

            expect(transitStationsUpdate).toHaveBeenCalledWith(LATEST_TRANSIT_ID, { isGoal: true }, tx);
        });
    });

    describe("連続ゴールボーナス", () => {
        it("連続ゴールでない場合はボーナスを登録しない", async () => {
            const res = await ArrivalGoalStationV3ServiceImpl.postArrivalGoalStationV3(buildRequest());

            expect(res.consecutiveGoalCount).toBe(1);
            expect(res.consecutiveGoalBonus).toBeNull();
            // 登録されるポイントは到着ポイントのみ
            expect(pointsCreate).toHaveBeenCalledTimes(1);
        });

        it("連続ゴールの場合はボーナスを総資産として追加登録する", async () => {
            // 直前のゴールも自チーム（＝連続2回目）
            findGoalStationsByEventCode.mockResolvedValue([
                buildTransitStation({ id: 2, teamCode: OWN_TEAM, isGoal: true }),
                buildTransitStation({ id: 1, teamCode: OTHER_TEAM, isGoal: true }),
            ]);
            const expectedBonus = GameConstants.CONSECUTIVE_GOAL_BONUS_PER_STATION_NUMBER * 3;

            const res = await ArrivalGoalStationV3ServiceImpl.postArrivalGoalStationV3(buildRequest());

            expect(res.consecutiveGoalCount).toBe(2);
            expect(res.consecutiveGoalBonus).toBe(expectedBonus);
            expect(pointsCreate).toHaveBeenCalledWith(
                TEST_EVENT_CODE,
                OWN_TEAM,
                expectedBonus,
                GameConstants.POINT_STATUS.SCORED,
                tx,
            );
        });

        it("連続ゴール数が増えるほどボーナスも増える", async () => {
            findGoalStationsByEventCode.mockResolvedValue([
                buildTransitStation({ id: 3, teamCode: OWN_TEAM, isGoal: true }),
                buildTransitStation({ id: 2, teamCode: OWN_TEAM, isGoal: true }),
                buildTransitStation({ id: 1, teamCode: OTHER_TEAM, isGoal: true }),
            ]);

            const res = await ArrivalGoalStationV3ServiceImpl.postArrivalGoalStationV3(buildRequest());

            expect(res.consecutiveGoalCount).toBe(3);
            expect(res.consecutiveGoalBonus).toBe(
                GameConstants.CONSECUTIVE_GOAL_BONUS_PER_STATION_NUMBER * 4,
            );
        });
    });

    describe("物件駅の購入", () => {
        // 物件駅の購入は駅ミッション成功時に物件駅購入フォームから行うため、到着処理では扱わない
        it("到着処理では物件駅の購入・代金の登録を行わない", async () => {
            await ArrivalGoalStationV3ServiceImpl.postArrivalGoalStationV3(buildRequest());

            expect(findByEventCodeAndStationCode).not.toHaveBeenCalled();
            expect(propertyPurchasesCreate).not.toHaveBeenCalled();
            expect(sumScoredPointsByTeamCode).not.toHaveBeenCalled();
            expect(pointsCreate.mock.calls.map((args) => args[3])).not.toContain(PointStatus.property);
        });

        it("所持金が0でも到着処理を行える", async () => {
            sumScoredPointsByTeamCode.mockResolvedValue(0);

            const res = await ArrivalGoalStationV3ServiceImpl.postArrivalGoalStationV3(buildRequest());

            expect(res.points).toBe(ARRIVAL_POINTS);
        });
    });

    describe("トランザクション", () => {
        it("ポイント登録・経由駅更新をすべて同じトランザクションで実行する", async () => {
            findGoalStationsByEventCode.mockResolvedValue([
                buildTransitStation({ id: 2, teamCode: OWN_TEAM, isGoal: true }),
                buildTransitStation({ id: 1, teamCode: OTHER_TEAM, isGoal: true }),
            ]);

            await ArrivalGoalStationV3ServiceImpl.postArrivalGoalStationV3(buildRequest());

            const calls = [...pointsCreate.mock.calls.map((args) => args[4]), transitStationsUpdate.mock.calls[0][2]];

            expect(pointsCreate).toHaveBeenCalledTimes(2);
            expect(calls.every((client) => client === tx)).toBe(true);
        });
    });

    describe("エラーハンドリング", () => {
        it("1つ前の目的駅が存在しない場合はDataIntegrityErrorになる", async () => {
            findPreviousGoalStation.mockResolvedValue(null);

            await expect(
                ArrivalGoalStationV3ServiceImpl.postArrivalGoalStationV3(buildRequest()),
            ).rejects.toThrow(DataIntegrityError);
        });

        it("チームの最新経由駅が存在しない場合はDataIntegrityErrorになる", async () => {
            findLatestByTeamCode.mockResolvedValue(null);

            await expect(
                ArrivalGoalStationV3ServiceImpl.postArrivalGoalStationV3(buildRequest()),
            ).rejects.toThrow(DataIntegrityError);
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            findByEventTypeCode.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                ArrivalGoalStationV3ServiceImpl.postArrivalGoalStationV3(buildRequest()),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ errorCode: "SOMETHING_ELSE" });
            findByEventTypeCode.mockRejectedValue(apiError);

            await expect(
                ArrivalGoalStationV3ServiceImpl.postArrivalGoalStationV3(buildRequest()),
            ).rejects.toBe(apiError);
        });
    });

    describe("レスポンス", () => {
        it("必要な項目がすべて含まれる", async () => {
            const res = await ArrivalGoalStationV3ServiceImpl.postArrivalGoalStationV3(buildRequest());

            expect(res).toEqual({
                points: ARRIVAL_POINTS,
                consecutiveGoalCount: 1,
                consecutiveGoalBonus: null,
            });
        });
    });
});
