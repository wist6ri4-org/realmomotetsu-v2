/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { InitHomeServiceImpl } from "@/features/init-home/service";
import { BombiiCounts } from "@/generated/prisma";
import {
    TEST_EVENT_CODE,
    TEST_EVENT_TYPE_CODE,
    buildBidirectionalNearbyStations,
    buildEvent,
    buildGoalStation,
    buildStation,
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

describe("InitHomeServiceImpl.getDataForHome", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findByEventCode: jest.Mock;
    let findLatestGoalStation: jest.Mock;
    let findCurrentBombiiTeam: jest.Mock;
    let sumPointsGroupedByTeamCode: jest.Mock;
    let sumScoredPointsGroupedByTeamCode: jest.Mock;
    let sumPropertyPointsGroupedByTeamCode: jest.Mock;
    let sumRevenuePointsGroupedByTeamCode: jest.Mock;
    let eventsFindByEventCode: jest.Mock;
    let countByEventCodeGroupedByTeamCode: jest.Mock;
    let findByEventTypeCode: jest.Mock;

    /** チームA（目的駅の1駅手前にいる） */
    const TEAM_A = buildTeam({ teamCode: "TEAM_A", teamName: "チームA" });
    /** チームB（目的駅の1駅手前にいる） */
    const TEAM_B = buildTeam({ teamCode: "TEAM_B", teamName: "チームB" });

    beforeEach(() => {
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
        findLatestGoalStation = jest.fn().mockResolvedValue(buildGoalStation({ stationCode: "STATION_G" }));
        findCurrentBombiiTeam = jest.fn().mockResolvedValue(null);
        sumPointsGroupedByTeamCode = jest.fn().mockResolvedValue([]);
        sumScoredPointsGroupedByTeamCode = jest.fn().mockResolvedValue([]);
        sumPropertyPointsGroupedByTeamCode = jest.fn().mockResolvedValue([]);
        sumRevenuePointsGroupedByTeamCode = jest.fn().mockResolvedValue([]);
        eventsFindByEventCode = jest.fn().mockResolvedValue(buildEvent({ eventTypeCode: TEST_EVENT_TYPE_CODE }));
        countByEventCodeGroupedByTeamCode = jest.fn().mockResolvedValue([]);
        findByEventTypeCode = jest.fn().mockResolvedValue(NEARBY_STATIONS);

        mockRepositories({
            teams: { findByEventCode },
            goalStations: { findLatestGoalStation },
            bombiiHistories: { findCurrentBombiiTeam, countByEventCodeGroupedByTeamCode },
            points: {
                sumPointsGroupedByTeamCode,
                sumScoredPointsGroupedByTeamCode,
                sumPropertyPointsGroupedByTeamCode,
                sumRevenuePointsGroupedByTeamCode,
            },
            events: { findByEventCode: eventsFindByEventCode },
            nearbyStations: { findByEventTypeCode },
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

            const res = await InitHomeServiceImpl.getDataForHome({ eventCode: TEST_EVENT_CODE });

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
            const res = await InitHomeServiceImpl.getDataForHome({ eventCode: TEST_EVENT_CODE });

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

            const res = await InitHomeServiceImpl.getDataForHome({ eventCode: TEST_EVENT_CODE });

            expect(res.teamData[0].teamColor).toBe("");
        });

        it("チームが1件も登録されていない場合は空配列を返す", async () => {
            findByEventCode.mockResolvedValue([]);

            const res = await InitHomeServiceImpl.getDataForHome({ eventCode: TEST_EVENT_CODE });

            expect(res.teamData).toEqual([]);
        });

        it("各チームの最新の経由駅から次の目的駅までの残り駅数を計算する", async () => {
            const res = await InitHomeServiceImpl.getDataForHome({ eventCode: TEST_EVENT_CODE });

            const teamA = res.teamData.find((t) => t.teamCode === "TEAM_A");
            const teamB = res.teamData.find((t) => t.teamCode === "TEAM_B");
            expect(teamA?.remainingStationsNumber).toBe(1);
            expect(teamB?.remainingStationsNumber).toBe(1);
        });
    });

    describe("次の目的駅", () => {
        it("次の目的駅が存在する場合はそのまま含める", async () => {
            const goalStation = buildGoalStation({ stationCode: "STATION_G" });
            findLatestGoalStation.mockResolvedValue(goalStation);

            const res = await InitHomeServiceImpl.getDataForHome({ eventCode: TEST_EVENT_CODE });

            expect(res.nextGoalStation).toEqual(goalStation);
        });

        it("次の目的駅が存在しない場合はnullを返す", async () => {
            findLatestGoalStation.mockResolvedValue(null);

            const res = await InitHomeServiceImpl.getDataForHome({ eventCode: TEST_EVENT_CODE });

            expect(res.nextGoalStation).toBeNull();
        });
    });

    describe("ボンビーチーム", () => {
        it("現在のボンビー履歴がある場合はそのチーム情報を返す", async () => {
            const bombiiTeamRaw = buildTeam({ teamCode: "TEAM_B", teamName: "チームB", teamColor: "#0000ff" });
            findCurrentBombiiTeam.mockResolvedValue({
                id: 1,
                teamCode: "TEAM_B",
                eventCode: TEST_EVENT_CODE,
                createdAt: bombiiTeamRaw.createdAt,
                updatedAt: bombiiTeamRaw.updatedAt,
                team: bombiiTeamRaw,
            });

            const res = await InitHomeServiceImpl.getDataForHome({ eventCode: TEST_EVENT_CODE });

            expect(res.bombiiTeam).toEqual(bombiiTeamRaw);
        });

        it("ボンビーチームのチームカラーが未設定の場合は空文字になる", async () => {
            const bombiiTeamRaw = buildTeam({ teamCode: "TEAM_B", teamColor: null });
            findCurrentBombiiTeam.mockResolvedValue({
                id: 1,
                teamCode: "TEAM_B",
                eventCode: TEST_EVENT_CODE,
                createdAt: bombiiTeamRaw.createdAt,
                updatedAt: bombiiTeamRaw.updatedAt,
                team: bombiiTeamRaw,
            });

            const res = await InitHomeServiceImpl.getDataForHome({ eventCode: TEST_EVENT_CODE });

            expect(res.bombiiTeam?.teamColor).toBe("");
        });

        it("現在のボンビー履歴がない場合はnullを返す", async () => {
            findCurrentBombiiTeam.mockResolvedValue(null);

            const res = await InitHomeServiceImpl.getDataForHome({ eventCode: TEST_EVENT_CODE });

            expect(res.bombiiTeam).toBeNull();
        });
    });

    describe("イベント種別の解決", () => {
        it("イベントが取得できない場合は空のイベント種別コードで近隣駅を取得する", async () => {
            eventsFindByEventCode.mockResolvedValue(null);

            await InitHomeServiceImpl.getDataForHome({ eventCode: TEST_EVENT_CODE });

            expect(findByEventTypeCode).toHaveBeenCalledWith("");
        });

        it("イベントが取得できた場合はそのイベント種別コードで近隣駅を取得する", async () => {
            eventsFindByEventCode.mockResolvedValue(buildEvent({ eventTypeCode: "CUSTOM_TYPE" }));

            await InitHomeServiceImpl.getDataForHome({ eventCode: TEST_EVENT_CODE });

            expect(findByEventTypeCode).toHaveBeenCalledWith("CUSTOM_TYPE");
        });
    });

    describe("エラーハンドリング", () => {
        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            findByEventCode.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                InitHomeServiceImpl.getDataForHome({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "conflict" });
            findByEventCode.mockRejectedValue(apiError);

            await expect(
                InitHomeServiceImpl.getDataForHome({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toBe(apiError);
        });
    });

    describe("駅データ", () => {
        it("目的駅に紐づく駅情報も含まれる", async () => {
            const station = buildStation({ stationCode: "STATION_G", name: "ゴール駅" });
            findLatestGoalStation.mockResolvedValue(
                buildGoalStation({ stationCode: "STATION_G" }, { name: "ゴール駅" }),
            );

            const res = await InitHomeServiceImpl.getDataForHome({ eventCode: TEST_EVENT_CODE });

            expect(res.nextGoalStation?.station).toMatchObject({ stationCode: station.stationCode, name: "ゴール駅" });
        });
    });
});
