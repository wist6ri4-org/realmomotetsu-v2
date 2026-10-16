/**
 * @jest-environment node
 */

import { PropertyPurchasesRepository } from "@/repositories/propertyPurchases/PropertyPurchasesRepository";
import { buildPropertyPurchase, buildPropertyPurchaseWithRelations } from "../../helpers/factories";
import { createPrismaMock, createPrismaTransactionMock, MockPrismaClient } from "../../helpers/prismaMock";

describe("PropertyPurchasesRepository", () => {
    let prisma: MockPrismaClient;
    let repository: PropertyPurchasesRepository;

    beforeEach(() => {
        prisma = createPrismaMock();
        repository = new PropertyPurchasesRepository(prisma);
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("findByEventCode", () => {
        it("イベントコードで絞り込み、イベント・チーム・駅情報を含めて作成日時の昇順で取得する", async () => {
            const propertyPurchases = [buildPropertyPurchaseWithRelations()];
            prisma.propertyPurchases.findMany.mockResolvedValue(propertyPurchases);

            const result = await repository.findByEventCode("TEST_EVENT");

            expect(prisma.propertyPurchases.findMany).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT" },
                include: { event: true, team: true, station: true },
                orderBy: { createdAt: "asc" },
            });
            expect(result).toBe(propertyPurchases);
        });

        it("DBエラー時はhandleDatabaseErrorにより汎用エラーへ変換される", async () => {
            prisma.propertyPurchases.findMany.mockRejectedValue(new Error("timeout"));

            await expect(repository.findByEventCode("TEST_EVENT")).rejects.toThrow(
                "Database operation failed: findByEventCode",
            );
        });
    });

    describe("findPurchasedByEventCode", () => {
        it("イベントコードで絞り込み、駅コードとチームカラーのみを作成日時の昇順で取得する", async () => {
            const routemapData = [{ stationCode: "STATION_A", team: { teamColor: "#ff0000" } }];
            prisma.propertyPurchases.findMany.mockResolvedValue(routemapData as never);

            const result = await repository.findPurchasedByEventCode("TEST_EVENT");

            expect(prisma.propertyPurchases.findMany).toHaveBeenCalledWith({
                select: {
                    stationCode: true,
                    team: {
                        select: {
                            teamColor: true,
                        },
                    },
                },
                where: { eventCode: "TEST_EVENT" },
                orderBy: { createdAt: "asc" },
            });
            expect(result).toBe(routemapData);
        });
    });

    describe("findByTeamCode", () => {
        it("チームコードで絞り込み、イベント・チーム・駅情報を含めて作成日時の昇順で取得する", async () => {
            const propertyPurchases = [buildPropertyPurchaseWithRelations({ teamCode: "TEAM_B" })];
            prisma.propertyPurchases.findMany.mockResolvedValue(propertyPurchases);

            const result = await repository.findByTeamCode("TEAM_B");

            expect(prisma.propertyPurchases.findMany).toHaveBeenCalledWith({
                where: { teamCode: "TEAM_B" },
                include: { event: true, team: true, station: true },
                orderBy: { createdAt: "asc" },
            });
            expect(result).toBe(propertyPurchases);
        });
    });

    describe("findByEventCodeAndStationCode", () => {
        it("トランザクションクライアントが未指定の場合は通常のprismaクライアントを使用する", async () => {
            const propertyPurchase = buildPropertyPurchaseWithRelations();
            prisma.propertyPurchases.findFirst.mockResolvedValue(propertyPurchase);

            const result = await repository.findByEventCodeAndStationCode("TEST_EVENT", "STATION_A");

            expect(prisma.propertyPurchases.findFirst).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT", stationCode: "STATION_A" },
                include: { event: true, team: true, station: true },
            });
            expect(result).toBe(propertyPurchase);
        });

        it("トランザクションクライアントが指定された場合はそちらを使用する", async () => {
            const propertyPurchase = buildPropertyPurchaseWithRelations();
            const tx = createPrismaTransactionMock();
            tx.propertyPurchases.findFirst.mockResolvedValue(propertyPurchase);

            const result = await repository.findByEventCodeAndStationCode("TEST_EVENT", "STATION_A", tx);

            expect(tx.propertyPurchases.findFirst).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT", stationCode: "STATION_A" },
                include: { event: true, team: true, station: true },
            });
            expect(prisma.propertyPurchases.findFirst).not.toHaveBeenCalled();
            expect(result).toBe(propertyPurchase);
        });

        it("該当する物件駅購入情報がない場合はnullを返す", async () => {
            prisma.propertyPurchases.findFirst.mockResolvedValue(null);

            const result = await repository.findByEventCodeAndStationCode("TEST_EVENT", "STATION_A");

            expect(result).toBeNull();
        });
    });

    describe("create", () => {
        it("トランザクションクライアントが未指定の場合は通常のprismaクライアントで作成する", async () => {
            const propertyPurchaseData = { eventCode: "TEST_EVENT", teamCode: "TEAM_A", stationCode: "STATION_A" };
            const created = buildPropertyPurchase(propertyPurchaseData);
            prisma.propertyPurchases.create.mockResolvedValue(created);

            const result = await repository.create(propertyPurchaseData);

            expect(prisma.propertyPurchases.create).toHaveBeenCalledWith({ data: propertyPurchaseData });
            expect(result).toBe(created);
        });

        it("トランザクションクライアントが指定された場合はそちらを使用する", async () => {
            const propertyPurchaseData = { eventCode: "TEST_EVENT", teamCode: "TEAM_A", stationCode: "STATION_B" };
            const tx = createPrismaTransactionMock();
            tx.propertyPurchases.create.mockResolvedValue(buildPropertyPurchase(propertyPurchaseData));

            await repository.create(propertyPurchaseData, tx);

            expect(tx.propertyPurchases.create).toHaveBeenCalledWith({ data: propertyPurchaseData });
            expect(prisma.propertyPurchases.create).not.toHaveBeenCalled();
        });

        it("DBエラー時はhandleDatabaseErrorにより汎用エラーへ変換される", async () => {
            prisma.propertyPurchases.create.mockRejectedValue(new Error("Unique constraint failed"));

            await expect(
                repository.create({ eventCode: "TEST_EVENT", teamCode: "TEAM_A", stationCode: "STATION_A" }),
            ).rejects.toThrow("Duplicate entry in create");
        });
    });

    describe("update", () => {
        it("トランザクションクライアントが未指定の場合は通常のprismaクライアントで更新する", async () => {
            const updateData = { teamCode: "TEAM_B" };
            const updated = buildPropertyPurchase({ id: 2, ...updateData });
            prisma.propertyPurchases.update.mockResolvedValue(updated);

            const result = await repository.update(2, updateData);

            expect(prisma.propertyPurchases.update).toHaveBeenCalledWith({
                where: { id: 2 },
                data: updateData,
            });
            expect(result).toBe(updated);
        });

        it("トランザクションクライアントが指定された場合はそちらを使用する", async () => {
            const updateData = { teamCode: "TEAM_C" };
            const tx = createPrismaTransactionMock();
            tx.propertyPurchases.update.mockResolvedValue(buildPropertyPurchase({ id: 3, ...updateData }));

            await repository.update(3, updateData, tx);

            expect(tx.propertyPurchases.update).toHaveBeenCalledWith({
                where: { id: 3 },
                data: updateData,
            });
            expect(prisma.propertyPurchases.update).not.toHaveBeenCalled();
        });
    });

    describe("delete", () => {
        it("トランザクションクライアントが未指定の場合は通常のprismaクライアントで削除する", async () => {
            const deleted = buildPropertyPurchase({ id: 9 });
            prisma.propertyPurchases.delete.mockResolvedValue(deleted);

            const result = await repository.delete(9);

            expect(prisma.propertyPurchases.delete).toHaveBeenCalledWith({ where: { id: 9 } });
            expect(result).toBe(deleted);
        });

        it("トランザクションクライアントが指定された場合はそちらを使用する", async () => {
            const deleted = buildPropertyPurchase({ id: 10 });
            const tx = createPrismaTransactionMock();
            tx.propertyPurchases.delete.mockResolvedValue(deleted);

            const result = await repository.delete(10, tx);

            expect(tx.propertyPurchases.delete).toHaveBeenCalledWith({ where: { id: 10 } });
            expect(prisma.propertyPurchases.delete).not.toHaveBeenCalled();
            expect(result).toBe(deleted);
        });
    });
});
