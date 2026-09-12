/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { InitRoutemapServiceImpl } from "@/features/init-routemap/service";
import { BombiiCounts } from "@/generated/prisma";
import { PropertyPurchasesForRoutemap } from "@/repositories/propertyPurchases/PropertyPurchasesRepository";
import {
    TEST_EVENT_CODE,
    TEST_EVENT_TYPE_CODE,
    buildBidirectionalNearbyStations,
    buildEvent,
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
 * 路線図用の物件駅購入情報を生成する
 * @param {Partial<PropertyPurchasesForRoutemap>} overrides - 上書きする項目
 * @return {PropertyPurchasesForRoutemap} 路線図用の物件駅購入情報
 */
const buildPropertyPurchaseForRoutemap = (
    overrides: Partial<PropertyPurchasesForRoutemap> = {},
): PropertyPurchasesForRoutemap => ({
    stationCode: "STATION_A",
    team: { teamColor: "#ff0000" },
    ...overrides,
});

describe("InitRoutemapServiceImpl.getDataForRoutemap", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findByEventCode: jest.Mock;
    let findLatestGoalStation: jest.Mock;
    let findCurrentBombiiTeam: jest.Mock;
    let eventsFindByEventCode: jest.Mock;
    let countByEventCodeGroupedByTeamCode: jest.Mock;
    let findByEventTypeCode: jest.Mock;
    let findPurchasedByEventCode: jest.Mock;

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
        eventsFindByEventCode = jest.fn().mockResolvedValue(buildEvent({ eventTypeCode: TEST_EVENT_TYPE_CODE }));
        countByEventCodeGroupedByTeamCode = jest.fn().mockResolvedValue([]);
        findByEventTypeCode = jest.fn().mockResolvedValue(NEARBY_STATIONS);
        findPurchasedByEventCode = jest.fn().mockResolvedValue([]);

        mockRepositories({
            teams: { findByEventCode },
            goalStations: { findLatestGoalStation },
            bombiiHistories: { findCurrentBombiiTeam, countByEventCodeGroupedByTeamCode },
            events: { findByEventCode: eventsFindByEventCode },
            nearbyStations: { findByEventTypeCode },
            propertyPurchases: { findPurchasedByEventCode },
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("チームデータの組み立て", () => {
        it("チームごとのボンビー回数をteamCodeで突き合わせて集計する", async () => {
            countByEventCodeGroupedByTeamCode.mockResolvedValue([buildBombiiCount({ teamCode: "TEAM_B", count: 3 })]);

            const res = await InitRoutemapServiceImpl.getDataForRoutemap({ eventCode: TEST_EVENT_CODE });

            const teamA = res.teamData.find((t) => t.teamCode === "TEAM_A");
            const teamB = res.teamData.find((t) => t.teamCode === "TEAM_B");
            expect(teamA?.bombiiCounts).toBe(0);
            expect(teamB?.bombiiCounts).toBe(3);
        });

        it("ポイント関連の項目は含まれない", async () => {
            const res = await InitRoutemapServiceImpl.getDataForRoutemap({ eventCode: TEST_EVENT_CODE });

            expect(res.teamData[0]).not.toHaveProperty("points");
            expect(res.teamData[0]).not.toHaveProperty("scoredPoints");
            expect(res.teamData[0]).not.toHaveProperty("propertyPurchasePoints");
            expect(res.teamData[0]).not.toHaveProperty("revenuePoints");
        });

        it("チームカラーが未設定の場合は空文字になる", async () => {
            findByEventCode.mockResolvedValue([
                {
                    ...TEAM_A,
                    teamColor: null,
                    transitStations: [buildTransitStation({ teamCode: "TEAM_A", stationCode: "STATION_A" })],
                },
            ]);

            const res = await InitRoutemapServiceImpl.getDataForRoutemap({ eventCode: TEST_EVENT_CODE });

            expect(res.teamData[0].teamColor).toBe("");
        });

        it("チームが1件も登録されていない場合は空配列を返す", async () => {
            findByEventCode.mockResolvedValue([]);

            const res = await InitRoutemapServiceImpl.getDataForRoutemap({ eventCode: TEST_EVENT_CODE });

            expect(res.teamData).toEqual([]);
        });

        it("各チームの最新の経由駅から次の目的駅までの残り駅数を計算する", async () => {
            const res = await InitRoutemapServiceImpl.getDataForRoutemap({ eventCode: TEST_EVENT_CODE });

            const teamA = res.teamData.find((t) => t.teamCode === "TEAM_A");
            const teamB = res.teamData.find((t) => t.teamCode === "TEAM_B");
            expect(teamA?.remainingStationsNumber).toBe(1);
            expect(teamB?.remainingStationsNumber).toBe(1);
        });
    });

    describe("物件駅購入情報", () => {
        it("イベントの物件駅購入情報をそのまま返す", async () => {
            const purchases = [
                buildPropertyPurchaseForRoutemap({ stationCode: "STATION_A", team: { teamColor: "#ff0000" } }),
                buildPropertyPurchaseForRoutemap({ stationCode: "STATION_B", team: { teamColor: "#0000ff" } }),
            ];
            findPurchasedByEventCode.mockResolvedValue(purchases);

            const res = await InitRoutemapServiceImpl.getDataForRoutemap({ eventCode: TEST_EVENT_CODE });

            expect(res.propertyPurchases).toEqual(purchases);
        });

        it("物件駅が1件も購入されていない場合は空配列を返す", async () => {
            const res = await InitRoutemapServiceImpl.getDataForRoutemap({ eventCode: TEST_EVENT_CODE });

            expect(res.propertyPurchases).toEqual([]);
        });
    });

    describe("次の目的駅", () => {
        it("次の目的駅が存在する場合はそのまま含める", async () => {
            const goalStation = buildGoalStation({ stationCode: "STATION_G" });
            findLatestGoalStation.mockResolvedValue(goalStation);

            const res = await InitRoutemapServiceImpl.getDataForRoutemap({ eventCode: TEST_EVENT_CODE });

            expect(res.nextGoalStation).toEqual(goalStation);
        });

        it("次の目的駅が存在しない場合はnullを返す", async () => {
            findLatestGoalStation.mockResolvedValue(null);

            const res = await InitRoutemapServiceImpl.getDataForRoutemap({ eventCode: TEST_EVENT_CODE });

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

            const res = await InitRoutemapServiceImpl.getDataForRoutemap({ eventCode: TEST_EVENT_CODE });

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

            const res = await InitRoutemapServiceImpl.getDataForRoutemap({ eventCode: TEST_EVENT_CODE });

            expect(res.bombiiTeam?.teamColor).toBe("");
        });

        it("現在のボンビー履歴がない場合はnullを返す", async () => {
            findCurrentBombiiTeam.mockResolvedValue(null);

            const res = await InitRoutemapServiceImpl.getDataForRoutemap({ eventCode: TEST_EVENT_CODE });

            expect(res.bombiiTeam).toBeNull();
        });
    });

    describe("イベント種別の解決", () => {
        it("イベントが取得できない場合は空のイベント種別コードで近隣駅を取得する", async () => {
            eventsFindByEventCode.mockResolvedValue(null);

            await InitRoutemapServiceImpl.getDataForRoutemap({ eventCode: TEST_EVENT_CODE });

            expect(findByEventTypeCode).toHaveBeenCalledWith("");
        });

        it("イベントが取得できた場合はそのイベント種別コードで近隣駅を取得する", async () => {
            eventsFindByEventCode.mockResolvedValue(buildEvent({ eventTypeCode: "CUSTOM_TYPE" }));

            await InitRoutemapServiceImpl.getDataForRoutemap({ eventCode: TEST_EVENT_CODE });

            expect(findByEventTypeCode).toHaveBeenCalledWith("CUSTOM_TYPE");
        });
    });

    describe("エラーハンドリング", () => {
        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            findByEventCode.mockRejectedValue(new Error("DB connection lost"));

            await expect(InitRoutemapServiceImpl.getDataForRoutemap({ eventCode: TEST_EVENT_CODE })).rejects.toThrow(
                InternalServerError,
            );
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "conflict" });
            findByEventCode.mockRejectedValue(apiError);

            await expect(InitRoutemapServiceImpl.getDataForRoutemap({ eventCode: TEST_EVENT_CODE })).rejects.toBe(
                apiError,
            );
        });

        it("物件駅購入情報の取得が失敗した場合もInternalServerErrorに変換される", async () => {
            findPurchasedByEventCode.mockRejectedValue(new Error("DB connection lost"));

            await expect(InitRoutemapServiceImpl.getDataForRoutemap({ eventCode: TEST_EVENT_CODE })).rejects.toThrow(
                InternalServerError,
            );
        });
    });
});
