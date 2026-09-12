/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { PointsBulkServiceImpl } from "@/features/points/bulk/service";
import { PointStatus } from "@/generated/prisma";
import { TEST_EVENT_CODE, buildPoints } from "../../../helpers/factories";
import { mockRepositories, mockWithTransaction, mockWithTransactionFailure } from "../../../helpers/repositoryMocks";

describe("PointsBulkServiceImpl", () => {
    /** 移動元チーム */
    const FROM_TEAM = "TEAM_A";
    /** 移動先チーム */
    const TO_TEAM = "TEAM_B";
    /** 移動するポイント数 */
    const POINTS = 1000;

    /** 各テストで参照するRepositoryのモックメソッド */
    let create: jest.Mock;
    /** withTransactionのコールバックに渡されるダミーのトランザクションクライアント */
    let tx: unknown;

    /**
     * リクエストを組み立てる
     * @return {Parameters<typeof PointsBulkServiceImpl.postBulkPoints>[0]} リクエスト
     */
    const buildRequest = () => ({
        eventCode: TEST_EVENT_CODE,
        fromTeamCode: FROM_TEAM,
        toTeamCode: TO_TEAM,
        points: POINTS,
        status: PointStatus.points,
    });

    beforeEach(() => {
        create = jest
            .fn()
            .mockImplementation(async (eventCode, teamCode, points, status) =>
                buildPoints({ eventCode, teamCode, points, status }),
            );

        mockRepositories({ points: { create } });
        tx = mockWithTransaction();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("postBulkPoints", () => {
        it("移動元にマイナス・移動先にプラスのポイントを同じトランザクションで登録する", async () => {
            const res = await PointsBulkServiceImpl.postBulkPoints(buildRequest());

            expect(create).toHaveBeenNthCalledWith(1, TEST_EVENT_CODE, FROM_TEAM, -POINTS, PointStatus.points, tx);
            expect(create).toHaveBeenNthCalledWith(2, TEST_EVENT_CODE, TO_TEAM, POINTS, PointStatus.points, tx);
            expect(res.fromPoint).toMatchObject({ teamCode: FROM_TEAM, points: -POINTS });
            expect(res.toPoint).toMatchObject({ teamCode: TO_TEAM, points: POINTS });
        });

        it("移動元・移動先の登録に同一のトランザクションクライアントが渡される", async () => {
            await PointsBulkServiceImpl.postBulkPoints(buildRequest());

            const usedClients = create.mock.calls.map((args) => args[4]);
            expect(usedClients).toEqual([tx, tx]);
        });

        it("指定したステータスでポイントを登録する", async () => {
            await PointsBulkServiceImpl.postBulkPoints({ ...buildRequest(), status: PointStatus.property });

            expect(create).toHaveBeenNthCalledWith(
                1,
                TEST_EVENT_CODE,
                FROM_TEAM,
                -POINTS,
                PointStatus.property,
                tx,
            );
            expect(create).toHaveBeenNthCalledWith(2, TEST_EVENT_CODE, TO_TEAM, POINTS, PointStatus.property, tx);
        });

        it("トランザクションが失敗した場合はInternalServerErrorに変換される", async () => {
            mockWithTransactionFailure(new Error("DB connection lost"));

            await expect(PointsBulkServiceImpl.postBulkPoints(buildRequest())).rejects.toThrow(InternalServerError);
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            create.mockRejectedValue(new Error("DB connection lost"));

            await expect(PointsBulkServiceImpl.postBulkPoints(buildRequest())).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "conflict" });
            create.mockRejectedValue(apiError);

            await expect(PointsBulkServiceImpl.postBulkPoints(buildRequest())).rejects.toBe(apiError);
        });
    });
});
