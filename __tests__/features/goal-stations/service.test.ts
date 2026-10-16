/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { GoalStationsServiceImpl } from "@/features/goal-stations/service";
import { TEST_EVENT_CODE, buildGoalStation } from "../../helpers/factories";
import { mockRepositories } from "../../helpers/repositoryMocks";

describe("GoalStationsServiceImpl", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findByEventCode: jest.Mock;
    let create: jest.Mock;

    beforeEach(() => {
        findByEventCode = jest.fn().mockResolvedValue([]);
        create = jest.fn().mockImplementation(async (data) => buildGoalStation(data));

        mockRepositories({ goalStations: { findByEventCode, create } });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getGoalStationsByEventCode", () => {
        it("イベントコードで取得した目的駅の一覧をそのまま返す", async () => {
            const goalStations = [
                buildGoalStation({ id: 1, stationCode: "STATION_A" }),
                buildGoalStation({ id: 2, stationCode: "STATION_B" }),
            ];
            findByEventCode.mockResolvedValue(goalStations);

            const res = await GoalStationsServiceImpl.getGoalStationsByEventCode({ eventCode: TEST_EVENT_CODE });

            expect(findByEventCode).toHaveBeenCalledWith(TEST_EVENT_CODE);
            expect(res.goalStations).toEqual(goalStations);
        });

        it("目的駅が1件もない場合は空配列を返す", async () => {
            const res = await GoalStationsServiceImpl.getGoalStationsByEventCode({ eventCode: TEST_EVENT_CODE });

            expect(res.goalStations).toEqual([]);
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            findByEventCode.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                GoalStationsServiceImpl.getGoalStationsByEventCode({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "conflict" });
            findByEventCode.mockRejectedValue(apiError);

            await expect(
                GoalStationsServiceImpl.getGoalStationsByEventCode({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toBe(apiError);
        });
    });

    describe("postGoalStations", () => {
        it("リクエストの内容で目的駅を登録する", async () => {
            const req = { eventCode: TEST_EVENT_CODE, stationCode: "STATION_A" };

            const res = await GoalStationsServiceImpl.postGoalStations(req);

            expect(create).toHaveBeenCalledWith({ eventCode: TEST_EVENT_CODE, stationCode: "STATION_A" });
            expect(res.goalStation).toMatchObject(req);
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            create.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                GoalStationsServiceImpl.postGoalStations({ eventCode: TEST_EVENT_CODE, stationCode: "STATION_A" }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "already exists" });
            create.mockRejectedValue(apiError);

            await expect(
                GoalStationsServiceImpl.postGoalStations({ eventCode: TEST_EVENT_CODE, stationCode: "STATION_A" }),
            ).rejects.toBe(apiError);
        });
    });
});
