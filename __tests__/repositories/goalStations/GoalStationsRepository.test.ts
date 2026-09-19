/**
 * @jest-environment node
 */

import { GoalStationsRepository } from "@/repositories/goalStations/GoalStationsRepository";
import { buildGoalStation, TEST_EVENT_CODE } from "../../helpers/factories";
import { createPrismaMock, MockPrismaClient } from "../../helpers/prismaMock";

describe("GoalStationsRepository", () => {
    let prisma: MockPrismaClient;
    let repository: GoalStationsRepository;

    beforeEach(() => {
        prisma = createPrismaMock();
        repository = new GoalStationsRepository(prisma);
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("findLatestGoalStation", () => {
        it("イベントコードで絞り込み、IDの降順で最新の目的駅を取得する", async () => {
            const goalStation = buildGoalStation({ id: 5 });
            prisma.goalStations.findFirst.mockResolvedValue(goalStation);

            const result = await repository.findLatestGoalStation(TEST_EVENT_CODE);

            expect(prisma.goalStations.findFirst).toHaveBeenCalledWith({
                where: { eventCode: TEST_EVENT_CODE },
                include: { station: true },
                orderBy: { id: "desc" },
            });
            expect(result).toBe(goalStation);
        });

        it("DBエラー時はhandleDatabaseErrorにより汎用エラーへ変換される", async () => {
            prisma.goalStations.findFirst.mockRejectedValue(new Error("timeout"));

            await expect(repository.findLatestGoalStation(TEST_EVENT_CODE)).rejects.toThrow(
                "Database operation failed: findNextGoalStation",
            );
        });
    });

    describe("findPreviousGoalStation", () => {
        it("最新の目的駅を1件スキップして、その1つ前の目的駅を取得する", async () => {
            const goalStation = buildGoalStation({ id: 4 });
            prisma.goalStations.findFirst.mockResolvedValue(goalStation);

            const result = await repository.findPreviousGoalStation(TEST_EVENT_CODE);

            expect(prisma.goalStations.findFirst).toHaveBeenCalledWith({
                where: { eventCode: TEST_EVENT_CODE },
                include: { station: true },
                orderBy: { id: "desc" },
                skip: 1,
            });
            expect(result).toBe(goalStation);
        });

        it("1つ前の目的駅が存在しない場合はnullを返す", async () => {
            prisma.goalStations.findFirst.mockResolvedValue(null);

            const result = await repository.findPreviousGoalStation(TEST_EVENT_CODE);

            expect(result).toBeNull();
        });
    });

    describe("findByEventCode", () => {
        it("イベントコードで絞り込み、IDの昇順ですべての目的駅を取得する", async () => {
            const goalStations = [
                buildGoalStation({ id: 1, stationCode: "STATION_A" }),
                buildGoalStation({ id: 2, stationCode: "STATION_B" }),
            ];
            prisma.goalStations.findMany.mockResolvedValue(goalStations);

            const result = await repository.findByEventCode(TEST_EVENT_CODE);

            expect(prisma.goalStations.findMany).toHaveBeenCalledWith({
                where: { eventCode: TEST_EVENT_CODE },
                include: { station: true },
                orderBy: { id: "asc" },
            });
            expect(result).toBe(goalStations);
        });
    });

    describe("create", () => {
        it("渡されたデータで目的駅を新規作成する", async () => {
            const goalStationData = { eventCode: TEST_EVENT_CODE, stationCode: "STATION_A" };
            const created = buildGoalStation(goalStationData);
            prisma.goalStations.create.mockResolvedValue(created);

            const result = await repository.create(goalStationData);

            expect(prisma.goalStations.create).toHaveBeenCalledWith({ data: goalStationData });
            expect(result).toBe(created);
        });
    });

    describe("delete", () => {
        it("指定したIDの目的駅を削除する", async () => {
            const deleted = buildGoalStation({ id: 9 });
            prisma.goalStations.delete.mockResolvedValue(deleted);

            const result = await repository.delete(9);

            expect(prisma.goalStations.delete).toHaveBeenCalledWith({ where: { id: 9 } });
            expect(result).toBe(deleted);
        });
    });
});
