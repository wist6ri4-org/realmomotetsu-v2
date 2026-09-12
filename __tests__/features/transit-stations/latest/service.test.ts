/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { LatestTransitStationsServiceImpl } from "@/features/transit-stations/latest/service";
import { TEST_EVENT_CODE, buildLatestTransitStation } from "../../../helpers/factories";
import { mockRepositories } from "../../../helpers/repositoryMocks";

describe("LatestTransitStationsServiceImpl", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findLatestByEventCode: jest.Mock;

    beforeEach(() => {
        findLatestByEventCode = jest.fn().mockResolvedValue([]);

        mockRepositories({ transitStations: { findLatestByEventCode } });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getLatestTransitStationsByEventCode", () => {
        it("イベントコードで取得した最新経由駅の一覧をそのまま返す", async () => {
            const latestTransitStations = [
                buildLatestTransitStation({ teamCode: "TEAM_A", stationCode: "STATION_A" }),
                buildLatestTransitStation({ teamCode: "TEAM_B", stationCode: "STATION_B" }),
            ];
            findLatestByEventCode.mockResolvedValue(latestTransitStations);

            const res = await LatestTransitStationsServiceImpl.getLatestTransitStationsByEventCode({
                eventCode: TEST_EVENT_CODE,
            });

            expect(findLatestByEventCode).toHaveBeenCalledWith(TEST_EVENT_CODE);
            expect(res.latestTransitStations).toEqual(latestTransitStations);
        });

        it("最新経由駅が1件もない場合は空配列を返す", async () => {
            const res = await LatestTransitStationsServiceImpl.getLatestTransitStationsByEventCode({
                eventCode: TEST_EVENT_CODE,
            });

            expect(res.latestTransitStations).toEqual([]);
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            findLatestByEventCode.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                LatestTransitStationsServiceImpl.getLatestTransitStationsByEventCode({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "conflict" });
            findLatestByEventCode.mockRejectedValue(apiError);

            await expect(
                LatestTransitStationsServiceImpl.getLatestTransitStationsByEventCode({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toBe(apiError);
        });
    });
});
