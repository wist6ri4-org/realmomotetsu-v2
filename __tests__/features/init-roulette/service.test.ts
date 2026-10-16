/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { InitRouletteServiceImpl } from "@/features/init-roulette/service";
import {
    TEST_EVENT_CODE,
    buildGoalStation,
    buildLatestTransitStation,
} from "../../helpers/factories";
import { mockRepositories } from "../../helpers/repositoryMocks";

describe("InitRouletteServiceImpl.getDataForRoulette", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findLatestByEventCode: jest.Mock;
    let findByEventCode: jest.Mock;

    beforeEach(() => {
        findLatestByEventCode = jest.fn().mockResolvedValue([]);
        findByEventCode = jest.fn().mockResolvedValue([]);

        mockRepositories({
            transitStations: { findLatestByEventCode },
            goalStations: { findByEventCode },
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("イベントコードで最新の経由駅と既出目的駅を取得してそのまま返す", async () => {
        const latestTransitStations = [
            buildLatestTransitStation({ teamCode: "TEAM_A", stationCode: "STATION_A" }),
        ];
        const goalStations = [buildGoalStation({ stationCode: "STATION_B" })];
        findLatestByEventCode.mockResolvedValue(latestTransitStations);
        findByEventCode.mockResolvedValue(goalStations);

        const res = await InitRouletteServiceImpl.getDataForRoulette({ eventCode: TEST_EVENT_CODE });

        expect(findLatestByEventCode).toHaveBeenCalledWith(TEST_EVENT_CODE);
        expect(findByEventCode).toHaveBeenCalledWith(TEST_EVENT_CODE);
        expect(res).toEqual({ latestTransitStations, goalStations });
    });

    it("経由駅・目的駅ともに存在しない場合は空配列を返す", async () => {
        const res = await InitRouletteServiceImpl.getDataForRoulette({ eventCode: TEST_EVENT_CODE });

        expect(res).toEqual({ latestTransitStations: [], goalStations: [] });
    });

    it("想定外のエラーはInternalServerErrorに変換される", async () => {
        findLatestByEventCode.mockRejectedValue(new Error("DB connection lost"));

        await expect(
            InitRouletteServiceImpl.getDataForRoulette({ eventCode: TEST_EVENT_CODE }),
        ).rejects.toThrow(InternalServerError);
    });

    it("ApiErrorはそのまま再スローされる", async () => {
        const apiError = new ConflictError({ message: "conflict" });
        findByEventCode.mockRejectedValue(apiError);

        await expect(
            InitRouletteServiceImpl.getDataForRoulette({ eventCode: TEST_EVENT_CODE }),
        ).rejects.toBe(apiError);
    });
});
