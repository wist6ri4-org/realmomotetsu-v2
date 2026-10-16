/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { InitOperationServiceImpl } from "@/features/init-operation/service";
import { BombiiCounts } from "@/generated/prisma";
import { EventWithRelations } from "@/repositories/events/EventsRepository";
import {
    TEST_EVENT_CODE,
    TEST_EVENT_TYPE_CODE,
    buildBidirectionalNearbyStations,
    buildEvent,
    buildEventType,
    buildGoalStation,
    buildTeam,
    buildTransitStation,
} from "../../helpers/factories";
import { mockRepositories } from "../../helpers/repositoryMocks";

/** 2チーム分の目的駅までの経路（各10分・1駅分） */
const NEARBY_STATIONS = buildBidirectionalNearbyStations([
    ["STATION_A", "STATION_G", 10],
    ["STATION_B", "STATION_G", 10],
]);

/**
 * ボンビーの回数（ビュー）を生成する
 * @param {Partial<BombiiCounts>} overrides - 上書きする項目
 * @return {BombiiCounts} ボンビーの回数
 */
const buildBombiiCount = (overrides: Partial<BombiiCounts> = {}): BombiiCounts => ({
    eventCode: TEST_EVENT_CODE,
    teamCode: "TEAM_A",
    count: 0,
    ...overrides,
});

/**
 * リレーション込みのイベントを生成する
 * @param {Partial<EventWithRelations>} overrides - 上書きする項目
 * @return {EventWithRelations} イベント
 */
const buildEventWithRelations = (overrides: Partial<EventWithRelations> = {}): EventWithRelations => ({
    ...buildEvent(),
    eventType: buildEventType(),
    ...overrides,
});

describe("InitOperationServiceImpl.getDataForOperation", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findByEventCodeWithRelations: jest.Mock;
    let findByEventCode: jest.Mock;
    let findByEventTypeCode: jest.Mock;
    let sumPointsGroupedByTeamCode: jest.Mock;
    let sumScoredPointsGroupedByTeamCode: jest.Mock;
    let sumPropertyPointsGroupedByTeamCode: jest.Mock;
    let sumRevenuePointsGroupedByTeamCode: jest.Mock;
    let findLatestGoalStation: jest.Mock;
    let countByEventCodeGroupedByTeamCode: jest.Mock;

    /** チームA（目的駅の1駅手前にいる） */
    const TEAM_A = buildTeam({ teamCode: "TEAM_A", teamName: "チームA" });
    /** チームB（目的駅の1駅手前にいる） */
    const TEAM_B = buildTeam({ teamCode: "TEAM_B", teamName: "チームB" });

    beforeEach(() => {
        findByEventCodeWithRelations = jest
            .fn()
            .mockResolvedValue(buildEventWithRelations({ eventTypeCode: TEST_EVENT_TYPE_CODE }));
        findByEventCode = jest.fn().mockResolvedValue([
            {
                ...TEAM_A,
                transitStations: [buildTransitStation({ teamCode: "TEAM_A", stationCode: "STATION_A" })],
            },
            {
                ...TEAM_B,
                transitStations: [buildTransitStation({ teamCode: "TEAM_B", stationCode: "STATION_B" })],
            },
        ]);
        findByEventTypeCode = jest.fn().mockResolvedValue(NEARBY_STATIONS);
        sumPointsGroupedByTeamCode = jest.fn().mockResolvedValue([]);
        sumScoredPointsGroupedByTeamCode = jest.fn().mockResolvedValue([]);
        sumPropertyPointsGroupedByTeamCode = jest.fn().mockResolvedValue([]);
        sumRevenuePointsGroupedByTeamCode = jest.fn().mockResolvedValue([]);
        findLatestGoalStation = jest.fn().mockResolvedValue(buildGoalStation({ stationCode: "STATION_G" }));
        countByEventCodeGroupedByTeamCode = jest.fn().mockResolvedValue([]);

        mockRepositories({
            events: { findByEventCodeWithRelations },
            teams: { findByEventCode },
            nearbyStations: { findByEventTypeCode },
            points: {
                sumPointsGroupedByTeamCode,
                sumScoredPointsGroupedByTeamCode,
                sumPropertyPointsGroupedByTeamCode,
                sumRevenuePointsGroupedByTeamCode,
            },
            goalStations: { findLatestGoalStation },
            bombiiHistories: { countByEventCodeGroupedByTeamCode },
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("チームデータの組み立て", () => {
        it("チームごとの合計ポイント・スコア済みポイント・物件購入ポイント・収益ポイント・ボンビー回数をteamCodeで突き合わせて集計する", async () => {
            sumPointsGroupedByTeamCode.mockResolvedValue([
                { teamCode: "TEAM_A", totalPoints: 100 },
                { teamCode: "TEAM_B", totalPoints: 200 },
            ]);
            sumScoredPointsGroupedByTeamCode.mockResolvedValue([{ teamCode: "TEAM_A", totalPoints: 50 }]);
            sumPropertyPointsGroupedByTeamCode.mockResolvedValue([{ teamCode: "TEAM_B", totalPoints: -30 }]);
            sumRevenuePointsGroupedByTeamCode.mockResolvedValue([{ teamCode: "TEAM_A", totalPoints: 10 }]);
            countByEventCodeGroupedByTeamCode.mockResolvedValue([
                buildBombiiCount({ teamCode: "TEAM_B", count: 3 }),
            ]);

            const res = await InitOperationServiceImpl.getDataForOperation({ eventCode: TEST_EVENT_CODE });

            const teamA = res.teamData.find((t) => t.teamCode === "TEAM_A");
            const teamB = res.teamData.find((t) => t.teamCode === "TEAM_B");
            expect(teamA).toMatchObject({
                points: 100,
                scoredPoints: 50,
                propertyPurchasePoints: 0,
                revenuePoints: 10,
                bombiiCounts: 0,
            });
            expect(teamB).toMatchObject({
                points: 200,
                scoredPoints: 0,
                propertyPurchasePoints: -30,
                revenuePoints: 0,
                bombiiCounts: 3,
            });
        });

        it("該当する集計データが1件もないチームはすべて0になる", async () => {
            const res = await InitOperationServiceImpl.getDataForOperation({ eventCode: TEST_EVENT_CODE });

            expect(res.teamData).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        teamCode: "TEAM_A",
                        points: 0,
                        scoredPoints: 0,
                        propertyPurchasePoints: 0,
                        revenuePoints: 0,
                        bombiiCounts: 0,
                    }),
                ]),
            );
        });

        it("チームカラーが未設定の場合は空文字になる", async () => {
            findByEventCode.mockResolvedValue([
                {
                    ...TEAM_A,
                    teamColor: null,
                    transitStations: [buildTransitStation({ teamCode: "TEAM_A", stationCode: "STATION_A" })],
                },
            ]);

            const res = await InitOperationServiceImpl.getDataForOperation({ eventCode: TEST_EVENT_CODE });

            expect(res.teamData[0].teamColor).toBe("");
        });

        it("チームが1件も登録されていない場合は空配列を返す", async () => {
            findByEventCode.mockResolvedValue([]);

            const res = await InitOperationServiceImpl.getDataForOperation({ eventCode: TEST_EVENT_CODE });

            expect(res.teamData).toEqual([]);
        });

        it("各チームの最新の経由駅から次の目的駅までの残り駅数を計算する", async () => {
            const res = await InitOperationServiceImpl.getDataForOperation({ eventCode: TEST_EVENT_CODE });

            const teamA = res.teamData.find((t) => t.teamCode === "TEAM_A");
            const teamB = res.teamData.find((t) => t.teamCode === "TEAM_B");
            expect(teamA?.remainingStationsNumber).toBe(1);
            expect(teamB?.remainingStationsNumber).toBe(1);
        });
    });

    describe("イベント種別の解決", () => {
        it("イベントが取得できない場合は空のイベント種別コードで近隣駅を取得する", async () => {
            findByEventCodeWithRelations.mockResolvedValue(null);

            await InitOperationServiceImpl.getDataForOperation({ eventCode: TEST_EVENT_CODE });

            expect(findByEventTypeCode).toHaveBeenCalledWith("");
        });

        it("イベントが取得できた場合はそのイベント種別コードで近隣駅を取得する", async () => {
            findByEventCodeWithRelations.mockResolvedValue(buildEventWithRelations({ eventTypeCode: "CUSTOM_TYPE" }));

            await InitOperationServiceImpl.getDataForOperation({ eventCode: TEST_EVENT_CODE });

            expect(findByEventTypeCode).toHaveBeenCalledWith("CUSTOM_TYPE");
        });

        it("イベント種別の取得を先に行い、他の取得は並列で行う", async () => {
            const callOrder: string[] = [];
            findByEventCodeWithRelations.mockImplementation(async () => {
                callOrder.push("event");
                return buildEventWithRelations({ eventTypeCode: TEST_EVENT_TYPE_CODE });
            });
            findByEventCode.mockImplementation(async () => {
                callOrder.push("teams");
                return [];
            });

            await InitOperationServiceImpl.getDataForOperation({ eventCode: TEST_EVENT_CODE });

            expect(callOrder[0]).toBe("event");
        });
    });

    describe("エラーハンドリング", () => {
        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            findByEventCode.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                InitOperationServiceImpl.getDataForOperation({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "conflict" });
            findByEventCode.mockRejectedValue(apiError);

            await expect(
                InitOperationServiceImpl.getDataForOperation({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toBe(apiError);
        });

        it("イベント種別の取得自体が失敗した場合もInternalServerErrorに変換される", async () => {
            findByEventCodeWithRelations.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                InitOperationServiceImpl.getDataForOperation({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toThrow(InternalServerError);
        });
    });
});
