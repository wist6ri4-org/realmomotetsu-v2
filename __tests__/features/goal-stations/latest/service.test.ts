/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError, ResourceNotFoundError } from "@/error";
import { LatestGoalStationsServiceImpl } from "@/features/goal-stations/latest/service";
import { TEST_EVENT_CODE, buildGoalStation } from "../../../helpers/factories";
import { captureError, mockRepositories } from "../../../helpers/repositoryMocks";

describe("LatestGoalStationsServiceImpl", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findLatestGoalStation: jest.Mock;

    beforeEach(() => {
        findLatestGoalStation = jest.fn().mockResolvedValue(buildGoalStation());

        mockRepositories({ goalStations: { findLatestGoalStation } });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getLatestGoalStationByEventCode", () => {
        it("イベントコードで取得した最新目的駅をそのまま返す", async () => {
            const goalStation = buildGoalStation({ id: 5, stationCode: "STATION_A" });
            findLatestGoalStation.mockResolvedValue(goalStation);

            const res = await LatestGoalStationsServiceImpl.getLatestGoalStationByEventCode({
                eventCode: TEST_EVENT_CODE,
            });

            expect(findLatestGoalStation).toHaveBeenCalledWith(TEST_EVENT_CODE);
            expect(res.goalStation).toEqual(goalStation);
        });

        it("最新目的駅が存在しない場合はResourceNotFoundErrorになる", async () => {
            findLatestGoalStation.mockResolvedValue(null);

            const error = await captureError(
                LatestGoalStationsServiceImpl.getLatestGoalStationByEventCode({ eventCode: TEST_EVENT_CODE }),
            );

            expect(error).toBeInstanceOf(ResourceNotFoundError);
            expect(error).toHaveProperty("statusCode", 404);
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            findLatestGoalStation.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                LatestGoalStationsServiceImpl.getLatestGoalStationByEventCode({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "conflict" });
            findLatestGoalStation.mockRejectedValue(apiError);

            await expect(
                LatestGoalStationsServiceImpl.getLatestGoalStationByEventCode({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toBe(apiError);
        });
    });
});
