/**
 * @jest-environment node
 */

import { PointsRepository } from "@/repositories/points/PointsRepository";
import { PointStatus } from "@/generated/prisma";
import { buildPoints } from "../../helpers/factories";
import { createPrismaMock, createPrismaTransactionMock, MockPrismaClient } from "../../helpers/prismaMock";

describe("PointsRepository", () => {
    let prisma: MockPrismaClient;
    let repository: PointsRepository;

    beforeEach(() => {
        prisma = createPrismaMock();
        repository = new PointsRepository(prisma);
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("findByEventCode", () => {
        it("イベントコードで絞り込み、作成日時の降順で取得する", async () => {
            const points = [buildPoints({ id: 1 })];
            prisma.points.findMany.mockResolvedValue(points);

            const result = await repository.findByEventCode("EVENT_A");

            expect(prisma.points.findMany).toHaveBeenCalledWith({
                where: { eventCode: "EVENT_A" },
                include: { team: true, event: true },
                orderBy: { createdAt: "desc" },
            });
            expect(result).toBe(points);
        });

        it("DBエラー時はhandleDatabaseErrorにより汎用エラーへ変換される", async () => {
            prisma.points.findMany.mockRejectedValue(new Error("timeout"));

            await expect(repository.findByEventCode("EVENT_A")).rejects.toThrow(
                "Database operation failed: findByEventCode",
            );
        });
    });

    describe("findByTeamCode", () => {
        it("チームコードで絞り込んで取得する", async () => {
            const points = [buildPoints({ id: 2, teamCode: "TEAM_B" })];
            prisma.points.findMany.mockResolvedValue(points);

            const result = await repository.findByTeamCode("TEAM_B");

            expect(prisma.points.findMany).toHaveBeenCalledWith({
                where: { teamCode: "TEAM_B" },
                include: { team: true, event: true },
                orderBy: { createdAt: "desc" },
            });
            expect(result).toBe(points);
        });
    });

    describe("sumPointsGroupedByTeamCode", () => {
        it("ステータスがpointsのレコードのみをチームごとに合計する", async () => {
            // groupByはオーバーロードが複雑でmockResolvedValueの型解決に失敗するため、jest.Mockとして扱う
            (prisma.points.groupBy as jest.Mock).mockResolvedValue([
                { teamCode: "TEAM_A", _sum: { points: 100 } },
                { teamCode: "TEAM_B", _sum: { points: null } },
            ]);

            const result = await repository.sumPointsGroupedByTeamCode("EVENT_A");

            expect(prisma.points.groupBy).toHaveBeenCalledWith({
                by: ["teamCode"],
                _sum: { points: true },
                where: { status: PointStatus.points, eventCode: "EVENT_A" },
            });
            // 合計がnullの場合は0に変換される
            expect(result).toEqual([
                { teamCode: "TEAM_A", totalPoints: 100 },
                { teamCode: "TEAM_B", totalPoints: 0 },
            ]);
        });
    });

    describe("sumScoredPointsGroupedByTeamCode", () => {
        it("scored/property/revenueのいずれかのレコードを合計する", async () => {
            (prisma.points.groupBy as jest.Mock).mockResolvedValue([
                { teamCode: "TEAM_A", _sum: { points: 300 } },
            ]);

            const result = await repository.sumScoredPointsGroupedByTeamCode("EVENT_A");

            expect(prisma.points.groupBy).toHaveBeenCalledWith({
                by: ["teamCode"],
                _sum: { points: true },
                where: {
                    OR: [
                        { status: PointStatus.scored },
                        { status: PointStatus.property },
                        { status: PointStatus.revenue },
                    ],
                    eventCode: "EVENT_A",
                },
            });
            expect(result).toEqual([{ teamCode: "TEAM_A", totalPoints: 300 }]);
        });
    });

    describe("sumPropertyPointsGroupedByTeamCode", () => {
        it("ステータスがpropertyのレコードのみを合計する", async () => {
            (prisma.points.groupBy as jest.Mock).mockResolvedValue([{ teamCode: "TEAM_A", _sum: { points: 50 } }]);

            await repository.sumPropertyPointsGroupedByTeamCode("EVENT_A");

            expect(prisma.points.groupBy).toHaveBeenCalledWith({
                by: ["teamCode"],
                _sum: { points: true },
                where: { status: PointStatus.property, eventCode: "EVENT_A" },
            });
        });
    });

    describe("sumRevenuePointsGroupedByTeamCode", () => {
        it("ステータスがrevenueのレコードのみを合計する", async () => {
            (prisma.points.groupBy as jest.Mock).mockResolvedValue([{ teamCode: "TEAM_A", _sum: { points: 20 } }]);

            await repository.sumRevenuePointsGroupedByTeamCode("EVENT_A");

            expect(prisma.points.groupBy).toHaveBeenCalledWith({
                by: ["teamCode"],
                _sum: { points: true },
                where: { status: PointStatus.revenue, eventCode: "EVENT_A" },
            });
        });
    });

    describe("sumScoredPointsByTeamCode", () => {
        it("トランザクションクライアントが指定された場合はそちらを使用する", async () => {
            const tx = createPrismaTransactionMock();
            tx.points.aggregate.mockResolvedValue({ _sum: { points: 400 } } as never);

            const result = await repository.sumScoredPointsByTeamCode("TEAM_A", "EVENT_A", tx);

            expect(tx.points.aggregate).toHaveBeenCalledWith({
                _sum: { points: true },
                where: {
                    teamCode: "TEAM_A",
                    eventCode: "EVENT_A",
                    OR: [
                        { status: PointStatus.scored },
                        { status: PointStatus.property },
                        { status: PointStatus.revenue },
                    ],
                },
            });
            expect(prisma.points.aggregate).not.toHaveBeenCalled();
            expect(result).toBe(400);
        });

        it("トランザクションクライアントが未指定の場合は通常のprismaクライアントを使用する", async () => {
            prisma.points.aggregate.mockResolvedValue({ _sum: { points: null } } as never);

            const result = await repository.sumScoredPointsByTeamCode("TEAM_A", "EVENT_A");

            expect(prisma.points.aggregate).toHaveBeenCalled();
            // 合計がnullの場合は0を返す
            expect(result).toBe(0);
        });
    });

    describe("create", () => {
        it("デフォルトステータス（points）でポイントを作成する", async () => {
            const created = buildPoints({ status: PointStatus.points });
            prisma.points.create.mockResolvedValue(created);

            const result = await repository.create("EVENT_A", "TEAM_A", 100);

            expect(prisma.points.create).toHaveBeenCalledWith({
                data: {
                    teamCode: "TEAM_A",
                    eventCode: "EVENT_A",
                    points: 100,
                    status: PointStatus.points,
                },
            });
            expect(result).toBe(created);
        });

        it("トランザクションクライアントが指定された場合はそちらを使用する", async () => {
            const tx = createPrismaTransactionMock();
            tx.points.create.mockResolvedValue(buildPoints());

            await repository.create("EVENT_A", "TEAM_A", 100, PointStatus.property, tx);

            expect(tx.points.create).toHaveBeenCalledWith({
                data: {
                    teamCode: "TEAM_A",
                    eventCode: "EVENT_A",
                    points: 100,
                    status: PointStatus.property,
                },
            });
            expect(prisma.points.create).not.toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("指定したIDのポイント数を更新する", async () => {
            const updated = buildPoints({ id: 5, points: 200 });
            prisma.points.update.mockResolvedValue(updated);

            const result = await repository.update(5, "TEAM_A", "EVENT_A", 200);

            expect(prisma.points.update).toHaveBeenCalledWith({
                where: { id: 5 },
                data: { points: 200 },
            });
            expect(result).toBe(updated);
        });
    });

    describe("updateStatusByTeamCode", () => {
        it("scoredへの更新はpointsステータスのレコードを対象にする", async () => {
            prisma.points.updateMany.mockResolvedValue({ count: 3 });

            const result = await repository.updateStatusByTeamCode("TEAM_A", PointStatus.scored);

            expect(prisma.points.updateMany).toHaveBeenCalledWith({
                where: { teamCode: "TEAM_A", status: PointStatus.points },
                data: { status: PointStatus.scored },
            });
            expect(result).toEqual({ count: 3 });
        });

        it("scored以外への更新はscoredステータスのレコードを対象にする", async () => {
            prisma.points.updateMany.mockResolvedValue({ count: 1 });

            await repository.updateStatusByTeamCode("TEAM_A", PointStatus.points);

            expect(prisma.points.updateMany).toHaveBeenCalledWith({
                where: { teamCode: "TEAM_A", status: PointStatus.scored },
                data: { status: PointStatus.points },
            });
        });
    });

    describe("delete", () => {
        it("指定したIDのポイントを削除する", async () => {
            const deleted = buildPoints({ id: 9 });
            prisma.points.delete.mockResolvedValue(deleted);

            const result = await repository.delete(9);

            expect(prisma.points.delete).toHaveBeenCalledWith({ where: { id: 9 } });
            expect(result).toBe(deleted);
        });
    });
});
