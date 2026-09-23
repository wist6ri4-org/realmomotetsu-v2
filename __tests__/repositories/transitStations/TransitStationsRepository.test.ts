/**
 * @jest-environment node
 */

import { TransitStationsRepository } from "@/repositories/transitStations/TransitStationsRepository";
import { PointStatus } from "@/generated/prisma";
import { buildTransitStation, buildLatestTransitStation, buildStation, buildPoints } from "../../helpers/factories";
import {
    createPrismaMock,
    createPrismaTransactionMock,
    MockPrismaClient,
    MockPrismaTransactionClient,
} from "../../helpers/prismaMock";

describe("TransitStationsRepository", () => {
    let prisma: MockPrismaClient;
    let repository: TransitStationsRepository;

    beforeEach(() => {
        prisma = createPrismaMock();
        repository = new TransitStationsRepository(prisma);
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("findByEventCode", () => {
        it("イベントコードで絞り込み、駅情報を含めてID昇順で取得する", async () => {
            const station = buildStation();
            const transitStations = [{ ...buildTransitStation(), station }];
            prisma.transitStations.findMany.mockResolvedValue(transitStations);

            const result = await repository.findByEventCode("TEST_EVENT");

            expect(prisma.transitStations.findMany).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT" },
                include: { station: true },
                orderBy: { id: "asc" },
            });
            expect(result).toBe(transitStations);
        });

        it("DBエラー時はhandleDatabaseErrorにより汎用エラーへ変換される", async () => {
            prisma.transitStations.findMany.mockRejectedValue(new Error("timeout"));

            await expect(repository.findByEventCode("TEST_EVENT")).rejects.toThrow(
                "Database operation failed: findByEventCode",
            );
        });
    });

    describe("findLatestByEventCode", () => {
        it("イベントコードで絞り込み、チームコード昇順で最新経由駅を取得する", async () => {
            const latestStations = [buildLatestTransitStation()];
            prisma.latestTransitStations.findMany.mockResolvedValue(latestStations);

            const result = await repository.findLatestByEventCode("TEST_EVENT");

            expect(prisma.latestTransitStations.findMany).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT" },
                orderBy: { teamCode: "asc" },
            });
            expect(result).toBe(latestStations);
        });
    });

    describe("findLatestByTeamCode", () => {
        it("チームコードで絞り込んで最新経由駅を1件取得する", async () => {
            const latestStation = buildLatestTransitStation();
            prisma.latestTransitStations.findFirst.mockResolvedValue(latestStation);

            const result = await repository.findLatestByTeamCode("TEAM_A");

            expect(prisma.latestTransitStations.findFirst).toHaveBeenCalledWith({
                where: { teamCode: "TEAM_A" },
            });
            expect(result).toBe(latestStation);
        });

        it("該当する経由駅がない場合はnullを返す", async () => {
            prisma.latestTransitStations.findFirst.mockResolvedValue(null);

            const result = await repository.findLatestByTeamCode("TEAM_A");

            expect(result).toBeNull();
        });
    });

    describe("findGoalStationsByEventCode", () => {
        it("イベントコードとゴールフラグで絞り込み、ID降順で取得する", async () => {
            const goalStations = [buildTransitStation({ isGoal: true })];
            prisma.transitStations.findMany.mockResolvedValue(goalStations);

            const result = await repository.findGoalStationsByEventCode("TEST_EVENT");

            expect(prisma.transitStations.findMany).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT", isGoal: true },
                orderBy: { id: "desc" },
            });
            expect(result).toBe(goalStations);
        });
    });

    describe("findById", () => {
        it("IDに一致する経由駅を、駅情報を含めて取得する", async () => {
            const station = buildStation();
            const transitStation = { ...buildTransitStation({ id: 5 }), station };
            prisma.transitStations.findUnique.mockResolvedValue(transitStation);

            const result = await repository.findById(5);

            expect(prisma.transitStations.findUnique).toHaveBeenCalledWith({
                where: { id: 5 },
                include: { station: true },
            });
            expect(result).toBe(transitStation);
        });

        it("該当する経由駅がない場合はnullを返す", async () => {
            prisma.transitStations.findUnique.mockResolvedValue(null);

            const result = await repository.findById(999);

            expect(result).toBeNull();
        });
    });

    describe("create", () => {
        it("トランザクションクライアントが未指定の場合は通常のprismaクライアントで経由駅を作成する", async () => {
            const transitStationData = { eventCode: "TEST_EVENT", teamCode: "TEAM_A", stationCode: "STATION_A" };
            const created = buildTransitStation(transitStationData);
            prisma.transitStations.create.mockResolvedValue(created);

            const result = await repository.create(transitStationData);

            expect(prisma.transitStations.create).toHaveBeenCalledWith({ data: transitStationData });
            expect(result).toBe(created);
        });

        it("トランザクションクライアントが指定された場合はそちらを使用する", async () => {
            const transitStationData = { eventCode: "TEST_EVENT", teamCode: "TEAM_A", stationCode: "STATION_B" };
            const tx = createPrismaTransactionMock();
            tx.transitStations.create.mockResolvedValue(buildTransitStation(transitStationData));

            await repository.create(transitStationData, tx);

            expect(tx.transitStations.create).toHaveBeenCalledWith({ data: transitStationData });
            expect(prisma.transitStations.create).not.toHaveBeenCalled();
        });
    });

    describe("createMany", () => {
        it("複数件をまとめて作成し、重複はスキップして作成件数を返す", async () => {
            const transitStationsData = [
                { stationCode: "STATION_A", eventCode: "TEST_EVENT", teamCode: "TEAM_A" },
                { stationCode: "STATION_B", eventCode: "TEST_EVENT", teamCode: "TEAM_B" },
            ];
            prisma.transitStations.createMany.mockResolvedValue({ count: 2 });

            const result = await repository.createMany(transitStationsData);

            expect(prisma.transitStations.createMany).toHaveBeenCalledWith({
                data: transitStationsData,
                skipDuplicates: true,
            });
            expect(result).toBe(2);
        });
    });

    describe("update", () => {
        it("トランザクションクライアントが未指定の場合は通常のprismaクライアントで経由駅を更新する", async () => {
            const updateData = { isGoal: true };
            const updated = buildTransitStation({ id: 3, ...updateData });
            prisma.transitStations.update.mockResolvedValue(updated);

            const result = await repository.update(3, updateData);

            expect(prisma.transitStations.update).toHaveBeenCalledWith({
                where: { id: 3 },
                data: updateData,
            });
            expect(result).toBe(updated);
        });

        it("トランザクションクライアントが指定された場合はそちらを使用する", async () => {
            const updateData = { isGoal: true };
            const tx = createPrismaTransactionMock();
            tx.transitStations.update.mockResolvedValue(buildTransitStation({ id: 4, ...updateData }));

            await repository.update(4, updateData, tx);

            expect(tx.transitStations.update).toHaveBeenCalledWith({
                where: { id: 4 },
                data: updateData,
            });
            expect(prisma.transitStations.update).not.toHaveBeenCalled();
        });
    });

    describe("delete", () => {
        it("IDを指定して経由駅を削除する", async () => {
            const deleted = buildTransitStation({ id: 7 });
            prisma.transitStations.delete.mockResolvedValue(deleted);

            const result = await repository.delete(7);

            expect(prisma.transitStations.delete).toHaveBeenCalledWith({ where: { id: 7 } });
            expect(result).toBe(deleted);
        });
    });

    describe("deleteAllByEvent", () => {
        it("イベントコードに一致する経由駅をすべて削除し、削除件数を返す", async () => {
            prisma.transitStations.deleteMany.mockResolvedValue({ count: 4 });

            const result = await repository.deleteAllByEvent("TEST_EVENT");

            expect(prisma.transitStations.deleteMany).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT" },
            });
            expect(result).toBe(4);
        });
    });

    describe("countByEvent", () => {
        it("イベントコードに一致する経由駅数を取得する", async () => {
            prisma.transitStations.count.mockResolvedValue(6);

            const result = await repository.countByEvent("TEST_EVENT");

            expect(prisma.transitStations.count).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT" },
            });
            expect(result).toBe(6);
        });
    });

    describe("createWithPoints", () => {
        it("経由駅とポイントを同一トランザクション内で作成する", async () => {
            const transitStationData = { eventCode: "TEST_EVENT", teamCode: "TEAM_A", stationCode: "STATION_A" };
            const pointsData = {
                eventCode: "TEST_EVENT",
                teamCode: "TEAM_A",
                points: 100,
                status: PointStatus.points,
            };
            const createdTransitStation = buildTransitStation(transitStationData);
            const createdPoint = buildPoints(pointsData);
            const tx = createPrismaTransactionMock();
            tx.transitStations.create.mockResolvedValue(createdTransitStation);
            tx.points.create.mockResolvedValue(createdPoint);
            prisma.$transaction.mockImplementation(async (operations) =>
                (operations as (tx: MockPrismaTransactionClient) => Promise<unknown>)(tx),
            );

            const result = await repository.createWithPoints(transitStationData, pointsData);

            expect(prisma.$transaction).toHaveBeenCalledTimes(1);
            expect(tx.transitStations.create).toHaveBeenCalledWith({ data: transitStationData });
            expect(tx.points.create).toHaveBeenCalledWith({ data: pointsData });
            expect(result).toEqual({ transitStation: createdTransitStation, point: createdPoint });
        });

        it("トランザクションが失敗した場合はhandleDatabaseErrorにより汎用エラーへ変換される", async () => {
            prisma.$transaction.mockRejectedValue(new Error("transaction failed") as never);

            await expect(
                repository.createWithPoints(
                    { eventCode: "TEST_EVENT", teamCode: "TEAM_A", stationCode: "STATION_A" },
                    { eventCode: "TEST_EVENT", teamCode: "TEAM_A", points: 100, status: PointStatus.points },
                ),
            ).rejects.toThrow("Database operation failed: createWithPoints");
        });
    });
});
