/**
 * @jest-environment node
 */

import { BombiiHistoriesRepository } from "@/repositories/bombiiHistories/BombiiHistoriesRepository";
import { buildBombiiHistory, buildTeam } from "../../helpers/factories";
import { createPrismaMock, MockPrismaClient } from "../../helpers/prismaMock";

describe("BombiiHistoriesRepository", () => {
    let prisma: MockPrismaClient;
    let repository: BombiiHistoriesRepository;

    beforeEach(() => {
        prisma = createPrismaMock();
        repository = new BombiiHistoriesRepository(prisma);
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("findCurrentBombiiTeam", () => {
        it("イベントコードで絞り込み、チーム情報を含めて最新の1件を取得する", async () => {
            const history = { ...buildBombiiHistory(), team: buildTeam() };
            prisma.bombiiHistories.findFirst.mockResolvedValue(history);

            const result = await repository.findCurrentBombiiTeam("TEST_EVENT");

            expect(prisma.bombiiHistories.findFirst).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT" },
                include: { team: true },
                orderBy: { createdAt: "desc" },
            });
            expect(result).toBe(history);
        });

        it("該当するボンビー履歴がない場合はnullを返す", async () => {
            prisma.bombiiHistories.findFirst.mockResolvedValue(null);

            const result = await repository.findCurrentBombiiTeam("TEST_EVENT");

            expect(result).toBeNull();
        });

        it("DBエラー時はhandleDatabaseErrorにより汎用エラーへ変換される", async () => {
            prisma.bombiiHistories.findFirst.mockRejectedValue(new Error("timeout"));

            await expect(repository.findCurrentBombiiTeam("TEST_EVENT")).rejects.toThrow(
                "Database operation failed: findCurrentBombiiTeam",
            );
        });
    });

    describe("findByEventCode", () => {
        it("イベントコードで絞り込み、チーム情報を含めて作成日時の降順で取得する", async () => {
            const histories = [{ ...buildBombiiHistory(), team: buildTeam() }];
            prisma.bombiiHistories.findMany.mockResolvedValue(histories);

            const result = await repository.findByEventCode("TEST_EVENT");

            expect(prisma.bombiiHistories.findMany).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT" },
                include: { team: true },
                orderBy: { createdAt: "desc" },
            });
            expect(result).toBe(histories);
        });
    });

    describe("countByEventCodeGroupedByTeamCode", () => {
        it("イベントコードで絞り込み、チームコードの昇順でボンビーカウントを取得する", async () => {
            const counts = [{ teamCode: "TEAM_A", eventCode: "TEST_EVENT", count: 2 }];
            prisma.bombiiCounts.findMany.mockResolvedValue(counts);

            const result = await repository.countByEventCodeGroupedByTeamCode("TEST_EVENT");

            expect(prisma.bombiiCounts.findMany).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT" },
                orderBy: { teamCode: "asc" },
            });
            expect(result).toBe(counts);
        });
    });

    describe("create", () => {
        it("渡されたデータでボンビー履歴を作成する", async () => {
            const bombiiHistoryData = { teamCode: "TEAM_A", eventCode: "TEST_EVENT" };
            const created = buildBombiiHistory(bombiiHistoryData);
            prisma.bombiiHistories.create.mockResolvedValue(created);

            const result = await repository.create(bombiiHistoryData);

            expect(prisma.bombiiHistories.create).toHaveBeenCalledWith({ data: bombiiHistoryData });
            expect(result).toBe(created);
        });
    });
});
