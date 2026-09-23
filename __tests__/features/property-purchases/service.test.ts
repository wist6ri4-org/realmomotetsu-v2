/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { PropertyPurchasesServiceImpl } from "@/features/property-purchases/service";
import {
    TEST_EVENT_CODE,
    buildPropertyPurchase,
    buildPropertyPurchaseWithRelations,
} from "../../helpers/factories";
import { mockRepositories } from "../../helpers/repositoryMocks";

describe("PropertyPurchasesServiceImpl", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findByEventCode: jest.Mock;
    let create: jest.Mock;

    beforeEach(() => {
        findByEventCode = jest.fn().mockResolvedValue([]);
        create = jest.fn().mockImplementation(async (data) => buildPropertyPurchase(data));

        mockRepositories({ propertyPurchases: { findByEventCode, create } });
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
            };

            const res = await PropertyPurchasesServiceImpl.postPropertyPurchases(req);

            expect(create).toHaveBeenCalledWith(req);
            expect(res.propertyPurchase).toMatchObject(req);
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            create.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                PropertyPurchasesServiceImpl.postPropertyPurchases({
                    eventCode: TEST_EVENT_CODE,
                    teamCode: "TEAM_A",
                    stationCode: "STATION_A",
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
                }),
            ).rejects.toBe(apiError);
        });
    });
});
