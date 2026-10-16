/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { GoalStationsServiceV3Impl } from "@/features/goal-stations-v3/service";
import { TEST_EVENT_CODE, buildGoalStation } from "../../helpers/factories";
import { mockRepositories } from "../../helpers/repositoryMocks";

describe("GoalStationsServiceV3Impl", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findByEventCode: jest.Mock;
    let createV3: jest.Mock;

    beforeEach(() => {
        findByEventCode = jest.fn().mockResolvedValue([]);
        createV3 = jest.fn().mockImplementation(async (data) => buildGoalStation(data));

        mockRepositories({ goalStations: { findByEventCode, createV3 } });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("postGoalStationsV3", () => {
        it("リクエストの内容で目的駅を登録する", async () => {
            const req = { eventCode: TEST_EVENT_CODE, stationCode: "STATION_A" };

            const res = await GoalStationsServiceV3Impl.postGoalStationsV3(req);

            expect(createV3).toHaveBeenCalledWith({ eventCode: TEST_EVENT_CODE, stationCode: "STATION_A" });
            expect(res.goalStation).toMatchObject(req);
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            createV3.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                GoalStationsServiceV3Impl.postGoalStationsV3({ eventCode: TEST_EVENT_CODE, stationCode: "STATION_A" }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "already exists" });
            createV3.mockRejectedValue(apiError);

            await expect(
                GoalStationsServiceV3Impl.postGoalStationsV3({ eventCode: TEST_EVENT_CODE, stationCode: "STATION_A" }),
            ).rejects.toBe(apiError);
        });
    });
});
