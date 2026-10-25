/**
 * @jest-environment node
 */

import { BadRequestError, ConflictError, InternalServerError, NotFoundError } from "@/error";
import { GameConstants } from "@/constants/gameConstants";
import { StationGrade } from "@/generated/prisma";
import { PropertyPurchasesServiceImpl } from "@/features/property-purchases/service";
import {
    TEST_EVENT_CODE,
    buildPropertyPurchase,
    buildPropertyPurchaseWithRelations,
    buildStation,
} from "../../helpers/factories";
import { mockRepositories, mockWithTransaction } from "../../helpers/repositoryMocks";

describe("PropertyPurchasesServiceImpl", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findByEventCode: jest.Mock;
    let create: jest.Mock;
    let pointsCreate: jest.Mock;
    let sumScoredPointsByTeamCode: jest.Mock;
    let findByStationCode: jest.Mock;

    beforeEach(() => {
        findByEventCode = jest.fn().mockResolvedValue([]);
        create = jest.fn().mockImplementation(async (data) => buildPropertyPurchase(data));

        pointsCreate = jest.fn().mockResolvedValue({});
        sumScoredPointsByTeamCode = jest.fn().mockResolvedValue(10_000);
        findByStationCode = jest
            .fn()
            .mockResolvedValue(buildStation({ stationCode: "STATION_A", stationGrade: StationGrade.a }));
        mockWithTransaction();

        mockRepositories({
            propertyPurchases: { findByEventCode, create },
            points: { create: pointsCreate, sumScoredPointsByTeamCode },
            stations: { findByStationCode },
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getPropertyPurchasesByEventCode", () => {
        it("イベントコードで取得した物件駅購入情報をそのまま返す", async () => {
            const propertyPurchases = [
                buildPropertyPurchaseWithRelations({ id: 1, stationCode: "STATION_A" }),
                buildPropertyPurchaseWithRelations({ id: 2, stationCode: "STATION_B" }),
            ];
            findByEventCode.mockResolvedValue(propertyPurchases);

            const res = await PropertyPurchasesServiceImpl.getPropertyPurchasesByEventCode({
                eventCode: TEST_EVENT_CODE,
            });

            expect(findByEventCode).toHaveBeenCalledWith(TEST_EVENT_CODE);
            expect(res.propertyPurchases).toEqual(propertyPurchases);
        });

        it("購入情報が1件もない場合は空配列を返す", async () => {
            const res = await PropertyPurchasesServiceImpl.getPropertyPurchasesByEventCode({
                eventCode: TEST_EVENT_CODE,
            });

            expect(res.propertyPurchases).toEqual([]);
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            findByEventCode.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                PropertyPurchasesServiceImpl.getPropertyPurchasesByEventCode({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "conflict" });
            findByEventCode.mockRejectedValue(apiError);

            await expect(
                PropertyPurchasesServiceImpl.getPropertyPurchasesByEventCode({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toBe(apiError);
        });
    });

    describe("postPropertyPurchases", () => {
        it("リクエストの内容で物件駅購入情報を登録する", async () => {
            const req = {
                eventCode: TEST_EVENT_CODE,
                teamCode: "TEAM_A",
                stationCode: "STATION_A",
                withPayment: true,
            };

            const res = await PropertyPurchasesServiceImpl.postPropertyPurchases(req);

            expect(create).toHaveBeenCalledWith(
                { eventCode: TEST_EVENT_CODE, teamCode: "TEAM_A", stationCode: "STATION_A" },
                expect.anything(),
            );
            expect(res.propertyPurchase).toMatchObject({ teamCode: "TEAM_A", stationCode: "STATION_A" });
        });

        it("支払いありの場合、駅の価格分のポイントをマイナスで記録する", async () => {
            await PropertyPurchasesServiceImpl.postPropertyPurchases({
                eventCode: TEST_EVENT_CODE,
                teamCode: "TEAM_A",
                stationCode: "STATION_A",
                withPayment: true,
            });

            expect(pointsCreate).toHaveBeenCalledWith(
                TEST_EVENT_CODE,
                "TEAM_A",
                -1 * GameConstants.STATION_GRADE[StationGrade.a].price,
                GameConstants.POINT_STATUS.PROPERTY,
                expect.anything(),
            );
        });

        it("支払いありで所持金が不足する場合はBadRequestErrorとなり、購入もポイント記録も行わない", async () => {
            sumScoredPointsByTeamCode.mockResolvedValue(GameConstants.STATION_GRADE[StationGrade.a].price - 1);

            await expect(
                PropertyPurchasesServiceImpl.postPropertyPurchases({
                    eventCode: TEST_EVENT_CODE,
                    teamCode: "TEAM_A",
                    stationCode: "STATION_A",
                    withPayment: true,
                }),
            ).rejects.toThrow(BadRequestError);
            expect(create).not.toHaveBeenCalled();
            expect(pointsCreate).not.toHaveBeenCalled();
        });

        it("支払いなしの場合は残高確認もポイント記録も行わず購入のみ登録する", async () => {
            sumScoredPointsByTeamCode.mockResolvedValue(0);

            await PropertyPurchasesServiceImpl.postPropertyPurchases({
                eventCode: TEST_EVENT_CODE,
                teamCode: "TEAM_A",
                stationCode: "STATION_A",
                withPayment: false,
            });

            expect(sumScoredPointsByTeamCode).not.toHaveBeenCalled();
            expect(pointsCreate).not.toHaveBeenCalled();
            expect(create).toHaveBeenCalledTimes(1);
        });

        it("駅が存在しない場合はNotFoundErrorとなる", async () => {
            findByStationCode.mockResolvedValue(null);

            await expect(
                PropertyPurchasesServiceImpl.postPropertyPurchases({
                    eventCode: TEST_EVENT_CODE,
                    teamCode: "TEAM_A",
                    stationCode: "UNKNOWN",
                    withPayment: true,
                }),
            ).rejects.toThrow(NotFoundError);
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            create.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                PropertyPurchasesServiceImpl.postPropertyPurchases({
                    eventCode: TEST_EVENT_CODE,
                    teamCode: "TEAM_A",
                    stationCode: "STATION_A",
                    withPayment: true,
                }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "already purchased" });
            create.mockRejectedValue(apiError);

            await expect(
                PropertyPurchasesServiceImpl.postPropertyPurchases({
                    eventCode: TEST_EVENT_CODE,
                    teamCode: "TEAM_A",
                    stationCode: "STATION_A",
                    withPayment: true,
                }),
            ).rejects.toBe(apiError);
        });
    });
});
