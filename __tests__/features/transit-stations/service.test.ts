/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { TransitStationsServiceImpl } from "@/features/transit-stations/service";
import { TEST_EVENT_CODE, buildStation, buildTransitStation } from "../../helpers/factories";
import { mockRepositories } from "../../helpers/repositoryMocks";
import { TransitStationsWithRelations } from "@/repositories/transitStations/TransitStationsRepository";

describe("TransitStationsServiceImpl", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findByEventCode: jest.Mock;
    let create: jest.Mock;

    /**
     * リレーション付き経由駅を生成する
     * @param {Partial<TransitStationsWithRelations>} overrides - 上書きする項目
     * @return {TransitStationsWithRelations} リレーション付き経由駅
     */
    const buildTransitStationWithRelations = (
        overrides: Partial<TransitStationsWithRelations> = {},
    ): TransitStationsWithRelations => ({
        ...buildTransitStation(overrides),
        station: buildStation({ stationCode: overrides.stationCode ?? "STATION_A" }),
    });

    beforeEach(() => {
        findByEventCode = jest.fn().mockResolvedValue([]);
        create = jest.fn().mockImplementation(async (data) => buildTransitStation(data));

        mockRepositories({ transitStations: { findByEventCode, create } });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getTransitStationsByEventCodeGroupedByTeamCode", () => {
        it("経由駅をチームコードごとにグループ化して返す", async () => {
            const transitStationA1 = buildTransitStationWithRelations({ id: 1, teamCode: "TEAM_A" });
            const transitStationA2 = buildTransitStationWithRelations({ id: 2, teamCode: "TEAM_A" });
            const transitStationB1 = buildTransitStationWithRelations({ id: 3, teamCode: "TEAM_B" });
            findByEventCode.mockResolvedValue([transitStationA1, transitStationA2, transitStationB1]);

            const res = await TransitStationsServiceImpl.getTransitStationsByEventCodeGroupedByTeamCode({
                eventCode: TEST_EVENT_CODE,
            });

            expect(findByEventCode).toHaveBeenCalledWith(TEST_EVENT_CODE);
            expect(res.transitStations).toEqual({
                TEAM_A: [transitStationA1, transitStationA2],
                TEAM_B: [transitStationB1],
            });
        });

        it("経由駅が1件もない場合は空オブジェクトを返す", async () => {
            const res = await TransitStationsServiceImpl.getTransitStationsByEventCodeGroupedByTeamCode({
                eventCode: TEST_EVENT_CODE,
            });

            expect(res.transitStations).toEqual({});
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            findByEventCode.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                TransitStationsServiceImpl.getTransitStationsByEventCodeGroupedByTeamCode({
                    eventCode: TEST_EVENT_CODE,
                }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "conflict" });
            findByEventCode.mockRejectedValue(apiError);

            await expect(
                TransitStationsServiceImpl.getTransitStationsByEventCodeGroupedByTeamCode({
                    eventCode: TEST_EVENT_CODE,
                }),
            ).rejects.toBe(apiError);
        });
    });

    describe("postTransitStations", () => {
        it("リクエストの内容で経由駅を登録する", async () => {
            const req = { eventCode: TEST_EVENT_CODE, teamCode: "TEAM_A", stationCode: "STATION_A" };

            const res = await TransitStationsServiceImpl.postTransitStations(req);

            expect(create).toHaveBeenCalledWith({
                eventCode: TEST_EVENT_CODE,
                stationCode: "STATION_A",
                teamCode: "TEAM_A",
            });
            expect(res.transitStation).toMatchObject(req);
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            create.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                TransitStationsServiceImpl.postTransitStations({
                    eventCode: TEST_EVENT_CODE,
                    teamCode: "TEAM_A",
                    stationCode: "STATION_A",
                }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "already exists" });
            create.mockRejectedValue(apiError);

            await expect(
                TransitStationsServiceImpl.postTransitStations({
                    eventCode: TEST_EVENT_CODE,
                    teamCode: "TEAM_A",
                    stationCode: "STATION_A",
                }),
            ).rejects.toBe(apiError);
        });
    });
});
