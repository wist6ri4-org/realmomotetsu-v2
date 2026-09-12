/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { CurrentLocationServiceImpl } from "@/features/current-location/service";
import { PointStatus } from "@/generated/prisma";
import { TEST_EVENT_CODE, buildPoints, buildTransitStation } from "../../helpers/factories";
import { mockRepositories } from "../../helpers/repositoryMocks";

describe("CurrentLocationServiceImpl", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let createWithPoints: jest.Mock;

    beforeEach(() => {
        createWithPoints = jest.fn().mockImplementation(async (transitStationData, pointsData) => ({
            transitStation: buildTransitStation(transitStationData),
            point: buildPoints(pointsData),
        }));

        mockRepositories({ transitStations: { createWithPoints } });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("postCurrentLocation", () => {
        it("リクエストの内容で現在地とポイントを登録する", async () => {
            const req = {
                eventCode: TEST_EVENT_CODE,
                teamCode: "TEAM_A",
                stationCode: "STATION_A",
                points: 100,
                status: PointStatus.scored,
            };

            const res = await CurrentLocationServiceImpl.postCurrentLocation(req);

            expect(createWithPoints).toHaveBeenCalledWith(
                {
                    eventCode: TEST_EVENT_CODE,
                    teamCode: "TEAM_A",
                    stationCode: "STATION_A",
                },
                {
                    eventCode: TEST_EVENT_CODE,
                    teamCode: "TEAM_A",
                    points: 100,
                    status: PointStatus.scored,
                },
            );
            expect(res.transitStation).toMatchObject({
                eventCode: TEST_EVENT_CODE,
                teamCode: "TEAM_A",
                stationCode: "STATION_A",
            });
            expect(res.point).toMatchObject({
                eventCode: TEST_EVENT_CODE,
                teamCode: "TEAM_A",
                points: 100,
                status: PointStatus.scored,
            });
        });

        it("statusを指定しない場合はデフォルトでpointsステータスになる", async () => {
            await CurrentLocationServiceImpl.postCurrentLocation({
                eventCode: TEST_EVENT_CODE,
                teamCode: "TEAM_A",
                stationCode: "STATION_A",
                points: 50,
            });

            expect(createWithPoints).toHaveBeenCalledWith(
                expect.objectContaining({ stationCode: "STATION_A" }),
                expect.objectContaining({ status: PointStatus.points }),
            );
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            createWithPoints.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                CurrentLocationServiceImpl.postCurrentLocation({
                    eventCode: TEST_EVENT_CODE,
                    teamCode: "TEAM_A",
                    stationCode: "STATION_A",
                    points: 100,
                }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "already registered" });
            createWithPoints.mockRejectedValue(apiError);

            await expect(
                CurrentLocationServiceImpl.postCurrentLocation({
                    eventCode: TEST_EVENT_CODE,
                    teamCode: "TEAM_A",
                    stationCode: "STATION_A",
                    points: 100,
                }),
            ).rejects.toBe(apiError);
        });
    });
});
