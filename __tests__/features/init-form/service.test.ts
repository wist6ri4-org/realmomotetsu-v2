/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { InitFormServiceImpl } from "@/features/init-form/service";
import LocationUtils from "@/utils/locationUtils";
import { TEST_EVENT_CODE, TEST_EVENT_TYPE_CODE, buildEvent, buildEventType, buildStation } from "../../helpers/factories";
import { mockRepositories } from "../../helpers/repositoryMocks";

describe("InitFormServiceImpl.getDataForForm", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findByEventCodeWithRelations: jest.Mock;
    let findStationsByEventTypeCode: jest.Mock;
    /** LocationUtils.calculateのモック（駅探索ロジック自体はutils層のテストで検証済みのため分離する） */
    let calculate: jest.SpyInstance;

    /** イベント取得の既定値（イベント種別コードの伝播元） */
    const event = { ...buildEvent(), eventType: buildEventType() };

    beforeEach(() => {
        findByEventCodeWithRelations = jest.fn().mockResolvedValue(event);
        findStationsByEventTypeCode = jest.fn().mockResolvedValue([]);
        calculate = jest.spyOn(LocationUtils, "calculate").mockReturnValue([]);

        mockRepositories({
            events: { findByEventCodeWithRelations },
            stations: { findByEventTypeCode: findStationsByEventTypeCode },
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("緯度・経度が指定されている場合は取得した駅一覧から最寄り駅を計算して返す", async () => {
        const stations = [buildStation({ stationCode: "STATION_A" })];
        findStationsByEventTypeCode.mockResolvedValue(stations);
        const closestStations = [{ stationCode: "STATION_A", distance: 1.23 }];
        calculate.mockReturnValue(closestStations);

        const res = await InitFormServiceImpl.getDataForForm({
            eventCode: TEST_EVENT_CODE,
            latitude: 35.0,
            longitude: 139.0,
        });

        expect(findByEventCodeWithRelations).toHaveBeenCalledWith(TEST_EVENT_CODE);
        expect(findStationsByEventTypeCode).toHaveBeenCalledWith(TEST_EVENT_TYPE_CODE);
        expect(calculate).toHaveBeenCalledWith(stations, 35.0, 139.0);
        expect(res.closestStations).toEqual(closestStations);
    });

    it("緯度・経度が指定されていない場合は最寄り駅を計算しない", async () => {
        const res = await InitFormServiceImpl.getDataForForm({ eventCode: TEST_EVENT_CODE });

        expect(calculate).not.toHaveBeenCalled();
        expect(res.closestStations).toBeUndefined();
    });

    it("緯度のみ指定されている場合は最寄り駅を計算しない", async () => {
        const res = await InitFormServiceImpl.getDataForForm({
            eventCode: TEST_EVENT_CODE,
            latitude: 35.0,
        });

        expect(calculate).not.toHaveBeenCalled();
        expect(res.closestStations).toBeUndefined();
    });

    it("経度のみ指定されている場合は最寄り駅を計算しない", async () => {
        const res = await InitFormServiceImpl.getDataForForm({
            eventCode: TEST_EVENT_CODE,
            longitude: 139.0,
        });

        expect(calculate).not.toHaveBeenCalled();
        expect(res.closestStations).toBeUndefined();
    });

    it("イベントが見つからない場合は空文字のイベント種別コードで駅を取得する", async () => {
        findByEventCodeWithRelations.mockResolvedValue(null);

        await InitFormServiceImpl.getDataForForm({ eventCode: TEST_EVENT_CODE });

        expect(findStationsByEventTypeCode).toHaveBeenCalledWith("");
    });

    it("想定外のエラーはInternalServerErrorに変換される", async () => {
        findByEventCodeWithRelations.mockRejectedValue(new Error("DB connection lost"));

        await expect(InitFormServiceImpl.getDataForForm({ eventCode: TEST_EVENT_CODE })).rejects.toThrow(
            InternalServerError,
        );
    });

    it("ApiErrorはそのまま再スローされる", async () => {
        const apiError = new ConflictError({ message: "conflict" });
        findStationsByEventTypeCode.mockRejectedValue(apiError);

        await expect(InitFormServiceImpl.getDataForForm({ eventCode: TEST_EVENT_CODE })).rejects.toBe(
            apiError,
        );
    });
});
