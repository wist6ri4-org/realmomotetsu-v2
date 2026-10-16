/**
 * @jest-environment node
 */

import { GameConstants } from "@/constants/gameConstants";
import { InternalServerError, DataIntegrityError } from "@/error";
import { CurrentLocationV3ServiceImpl } from "@/features/current-location-v3/service";
import { PostCurrentLocationV3Request } from "@/features/current-location-v3/types";
import { StationGrade, StationType } from "@/generated/prisma";
import {
    TEST_EVENT_CODE,
    buildPoints,
    buildPropertyPurchaseWithRelations,
    buildStation,
    buildTransitStation,
} from "../../helpers/factories";
import { mockRepositories, mockWithTransaction } from "../../helpers/repositoryMocks";

/** 現在地登録を行うチーム */
const OWN_TEAM = "TEAM_A";
/** 物件駅を所有する他チーム */
const OTHER_TEAM = "TEAM_B";

/**
 * リクエストを組み立てる
 * @param {Partial<PostCurrentLocationV3Request>} overrides - 上書きする項目
 * @return {PostCurrentLocationV3Request} リクエスト
 */
const buildRequest = (
    overrides: Partial<PostCurrentLocationV3Request> = {},
): PostCurrentLocationV3Request => ({
    eventCode: TEST_EVENT_CODE,
    teamCode: OWN_TEAM,
    stationCode: "STATION_A",
    ...overrides,
});

describe("CurrentLocationV3ServiceImpl.postCurrentLocationV3", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let stationsFindByStationCode: jest.Mock;
    let propertyPurchasesFindByEventCodeAndStationCode: jest.Mock;
    let transitStationsCreate: jest.Mock;
    let pointsCreate: jest.Mock;

    beforeEach(() => {
        stationsFindByStationCode = jest.fn();
        propertyPurchasesFindByEventCodeAndStationCode = jest.fn().mockResolvedValue(null);
        transitStationsCreate = jest.fn().mockResolvedValue(buildTransitStation());
        pointsCreate = jest.fn().mockImplementation(async (eventCode, teamCode, points, status) =>
            buildPoints({ eventCode, teamCode, points, status }),
        );

        mockRepositories({
            stations: { findByStationCode: stationsFindByStationCode },
            propertyPurchases: {
                findByEventCodeAndStationCode: propertyPurchasesFindByEventCodeAndStationCode,
            },
            transitStations: { create: transitStationsCreate },
            points: { create: pointsCreate },
        });
        mockWithTransaction();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("経由駅の登録", () => {
        it("リクエストの内容で経由駅を登録する", async () => {
            stationsFindByStationCode.mockResolvedValue(
                buildStation({ stationCode: "STATION_A", stationType: StationType.treasure }),
            );

            const res = await CurrentLocationV3ServiceImpl.postCurrentLocationV3(buildRequest());

            expect(transitStationsCreate).toHaveBeenCalledWith(
                {
                    eventCode: TEST_EVENT_CODE,
                    teamCode: OWN_TEAM,
                    stationCode: "STATION_A",
                },
                expect.anything(),
            );
            expect(res.transitStation).toBeDefined();
        });

        it("駅が存在しない場合はDataIntegrityErrorになる", async () => {
            stationsFindByStationCode.mockResolvedValue(null);

            await expect(CurrentLocationV3ServiceImpl.postCurrentLocationV3(buildRequest())).rejects.toThrow(
                DataIntegrityError,
            );
            expect(transitStationsCreate).not.toHaveBeenCalled();
        });
    });

    describe("効果駅の処理", () => {
        it("プラス駅では駅グレードに応じたポイントが加算される", async () => {
            stationsFindByStationCode.mockResolvedValue(
                buildStation({ stationType: StationType.plus, stationGrade: StationGrade.a }),
            );

            const res = await CurrentLocationV3ServiceImpl.postCurrentLocationV3(buildRequest());

            expect(pointsCreate).toHaveBeenCalledWith(
                TEST_EVENT_CODE,
                OWN_TEAM,
                GameConstants.STATION_GRADE.a.plus,
                GameConstants.POINT_STATUS.SCORED,
                expect.anything(),
            );
            expect(res.point?.points).toBe(GameConstants.STATION_GRADE.a.plus);
        });

        it("マイナス駅では駅グレードに応じたポイントが減算される", async () => {
            stationsFindByStationCode.mockResolvedValue(
                buildStation({ stationType: StationType.minus, stationGrade: StationGrade.b }),
            );

            const res = await CurrentLocationV3ServiceImpl.postCurrentLocationV3(buildRequest());

            expect(res.point?.points).toBe(GameConstants.STATION_GRADE.b.minus);
            expect(GameConstants.STATION_GRADE.b.minus).toBeLessThan(0);
        });

        it("駅グレードが未設定の場合はグレードなしの金額が適用される", async () => {
            stationsFindByStationCode.mockResolvedValue(
                buildStation({ stationType: StationType.plus, stationGrade: null }),
            );

            const res = await CurrentLocationV3ServiceImpl.postCurrentLocationV3(buildRequest());

            expect(res.point?.points).toBe(GameConstants.STATION_GRADE.none.plus);
        });

        it.each([[StationType.treasure], [StationType.card], [null]])(
            "%s駅ではポイントが登録されない",
            async (stationType) => {
                stationsFindByStationCode.mockResolvedValue(buildStation({ stationType }));

                const res = await CurrentLocationV3ServiceImpl.postCurrentLocationV3(buildRequest());

                expect(pointsCreate).not.toHaveBeenCalled();
                expect(res.point).toBeUndefined();
            },
        );
    });

    describe("物件駅の収益処理", () => {
        beforeEach(() => {
            stationsFindByStationCode.mockResolvedValue(
                buildStation({ stationCode: "STATION_A", stationType: StationType.mission }),
            );
        });

        it("他チームが所有する物件駅に到着すると所有チームに収益が入る", async () => {
            propertyPurchasesFindByEventCodeAndStationCode.mockResolvedValue(
                buildPropertyPurchaseWithRelations(
                    { teamCode: OTHER_TEAM, stationCode: "STATION_A" },
                    { station: { stationGrade: StationGrade.a } },
                ),
            );

            const res = await CurrentLocationV3ServiceImpl.postCurrentLocationV3(buildRequest());

            const expectedRevenue = GameConstants.STATION_GRADE.a.price * GameConstants.REVENUE_RATE;
            // 収益の登録先は到着したチームではなく、物件を所有するチーム
            expect(pointsCreate).toHaveBeenCalledWith(
                TEST_EVENT_CODE,
                OTHER_TEAM,
                expectedRevenue,
                GameConstants.POINT_STATUS.REVENUE,
                expect.anything(),
            );
            expect(res.point?.points).toBe(expectedRevenue);
        });

        // TSK-79の回帰テスト: 自チーム所有の物件駅で収益が発生していた不具合の再発防止
        it("自チームが所有する物件駅に到着しても収益は発生しない", async () => {
            propertyPurchasesFindByEventCodeAndStationCode.mockResolvedValue(
                buildPropertyPurchaseWithRelations(
                    { teamCode: OWN_TEAM, stationCode: "STATION_A" },
                    { station: { stationGrade: StationGrade.a } },
                ),
            );

            const res = await CurrentLocationV3ServiceImpl.postCurrentLocationV3(buildRequest());

            expect(pointsCreate).not.toHaveBeenCalled();
            expect(res.point).toBeUndefined();
        });

        it("未購入のミッション駅ではポイントが登録されない", async () => {
            propertyPurchasesFindByEventCodeAndStationCode.mockResolvedValue(null);

            const res = await CurrentLocationV3ServiceImpl.postCurrentLocationV3(buildRequest());

            expect(pointsCreate).not.toHaveBeenCalled();
            expect(res.point).toBeUndefined();
        });

        it("収益通知用に所有チームのWebhook URLを返す", async () => {
            const webhookUrl = "https://discord.com/api/webhooks/other-team";
            propertyPurchasesFindByEventCodeAndStationCode.mockResolvedValue(
                buildPropertyPurchaseWithRelations(
                    { teamCode: OTHER_TEAM, stationCode: "STATION_A" },
                    { team: { discordWebhookUrl: webhookUrl } },
                ),
            );

            const res = await CurrentLocationV3ServiceImpl.postCurrentLocationV3(buildRequest());

            expect(res.teamDiscordWebhookUrl).toBe(webhookUrl);
        });

        it("物件が購入されていない場合はWebhook URLを返さない", async () => {
            propertyPurchasesFindByEventCodeAndStationCode.mockResolvedValue(null);

            const res = await CurrentLocationV3ServiceImpl.postCurrentLocationV3(buildRequest());

            expect(res.teamDiscordWebhookUrl).toBeUndefined();
        });
    });

    describe("エラーハンドリング", () => {
        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            stationsFindByStationCode.mockRejectedValue(new Error("DB connection lost"));

            await expect(CurrentLocationV3ServiceImpl.postCurrentLocationV3(buildRequest())).rejects.toThrow(
                InternalServerError,
            );
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new DataIntegrityError("data integrity error");
            stationsFindByStationCode.mockRejectedValue(apiError);

            await expect(CurrentLocationV3ServiceImpl.postCurrentLocationV3(buildRequest())).rejects.toBe(
                apiError,
            );
        });
    });
});
