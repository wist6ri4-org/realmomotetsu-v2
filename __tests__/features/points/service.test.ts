/**
 * @jest-environment node
 */

import { GameConstants } from "@/constants/gameConstants";
import { ConflictError, InternalServerError } from "@/error";
import { PointsServiceImpl } from "@/features/points/service";
import { PointStatus } from "@/generated/prisma";
import { TEST_EVENT_CODE, buildPoints } from "../../helpers/factories";
import { mockRepositories } from "../../helpers/repositoryMocks";

describe("PointsServiceImpl", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findByEventCode: jest.Mock;
    let create: jest.Mock;
    let updateStatusByTeamCode: jest.Mock;

    beforeEach(() => {
        findByEventCode = jest.fn().mockResolvedValue([]);
        create = jest.fn().mockImplementation(async (eventCode, teamCode, points, status) =>
            buildPoints({ eventCode, teamCode, points, status }),
        );
        updateStatusByTeamCode = jest.fn().mockResolvedValue({ count: 0 });

        mockRepositories({ points: { findByEventCode, create, updateStatusByTeamCode } });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getPointsByEventCodeGroupedByTeamCode", () => {
        it("取得したポイントをチームコード・ステータスごとにグループ化して返す", async () => {
            const scoredA1 = buildPoints({ id: 1, teamCode: "TEAM_A", status: PointStatus.scored, points: 100 });
            const scoredA2 = buildPoints({ id: 2, teamCode: "TEAM_A", status: PointStatus.scored, points: 200 });
            const propertyB = buildPoints({ id: 3, teamCode: "TEAM_B", status: PointStatus.property, points: -50 });
            findByEventCode.mockResolvedValue([scoredA1, scoredA2, propertyB]);

            const res = await PointsServiceImpl.getPointsByEventCodeGroupedByTeamCode({
                eventCode: TEST_EVENT_CODE,
            });

            expect(findByEventCode).toHaveBeenCalledWith(TEST_EVENT_CODE);
            expect(res.points.TEAM_A.scored).toEqual([scoredA1, scoredA2]);
            expect(res.points.TEAM_A.points).toEqual([]);
            expect(res.points.TEAM_A.property).toEqual([]);
            expect(res.points.TEAM_A.revenue).toEqual([]);
            expect(res.points.TEAM_B.property).toEqual([propertyB]);
            expect(res.points.TEAM_B.scored).toEqual([]);
        });

        it("ポイントが1件もない場合は空オブジェクトを返す", async () => {
            const res = await PointsServiceImpl.getPointsByEventCodeGroupedByTeamCode({
                eventCode: TEST_EVENT_CODE,
            });

            expect(res.points).toEqual({});
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            findByEventCode.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                PointsServiceImpl.getPointsByEventCodeGroupedByTeamCode({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "conflict" });
            findByEventCode.mockRejectedValue(apiError);

            await expect(
                PointsServiceImpl.getPointsByEventCodeGroupedByTeamCode({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toBe(apiError);
        });
    });

    describe("postPoints", () => {
        it("リクエストの内容でポイントを登録する", async () => {
            const req = {
                eventCode: TEST_EVENT_CODE,
                teamCode: "TEAM_A",
                points: 500,
                status: GameConstants.POINT_STATUS.SCORED,
            };

            const res = await PointsServiceImpl.postPoints(req);

            expect(create).toHaveBeenCalledWith(req.eventCode, req.teamCode, req.points, req.status);
            expect(res.point).toMatchObject(req);
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            create.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                PointsServiceImpl.postPoints({
                    eventCode: TEST_EVENT_CODE,
                    teamCode: "TEAM_A",
                    points: 500,
                    status: GameConstants.POINT_STATUS.SCORED,
                }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "conflict" });
            create.mockRejectedValue(apiError);

            await expect(
                PointsServiceImpl.postPoints({
                    eventCode: TEST_EVENT_CODE,
                    teamCode: "TEAM_A",
                    points: 500,
                    status: GameConstants.POINT_STATUS.SCORED,
                }),
            ).rejects.toBe(apiError);
        });
    });

    describe("putPoints", () => {
        it("チームコードを指定してポイントのステータスをscoredに更新する", async () => {
            updateStatusByTeamCode.mockResolvedValue({ count: 3 });

            const res = await PointsServiceImpl.putPoints({ teamCode: "TEAM_A" });

            expect(updateStatusByTeamCode).toHaveBeenCalledWith("TEAM_A", GameConstants.POINT_STATUS.SCORED);
            expect(res).toEqual({ count: 3 });
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            updateStatusByTeamCode.mockRejectedValue(new Error("DB connection lost"));

            await expect(PointsServiceImpl.putPoints({ teamCode: "TEAM_A" })).rejects.toThrow(
                InternalServerError,
            );
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "conflict" });
            updateStatusByTeamCode.mockRejectedValue(apiError);

            await expect(PointsServiceImpl.putPoints({ teamCode: "TEAM_A" })).rejects.toBe(apiError);
        });
    });
});
