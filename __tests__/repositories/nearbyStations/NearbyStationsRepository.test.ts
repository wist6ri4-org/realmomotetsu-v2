/**
 * @jest-environment node
 */

import { NearbyStationsRepository } from "@/repositories/nearbyStations/NearbyStationsRepository";
import {
    buildBidirectionalNearbyStations,
    buildNearbyStation,
    TEST_EVENT_TYPE_CODE,
} from "../../helpers/factories";
import { createPrismaMock, MockPrismaClient } from "../../helpers/prismaMock";

describe("NearbyStationsRepository", () => {
    let prisma: MockPrismaClient;
    let repository: NearbyStationsRepository;

    beforeEach(() => {
        prisma = createPrismaMock();
        repository = new NearbyStationsRepository(prisma);
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("findFromStation", () => {
        it("出発駅コードで絞り込み、所要時間の昇順で取得する", async () => {
            const nearbyStations = buildBidirectionalNearbyStations([["STATION_A", "STATION_B", 5]]);
            prisma.nearbyStations.findMany.mockResolvedValue(nearbyStations);

            const result = await repository.findFromStation("STATION_A");

            expect(prisma.nearbyStations.findMany).toHaveBeenCalledWith({
                where: { fromStationCode: "STATION_A" },
                include: { fromStation: true, toStation: true },
                orderBy: { timeMinutes: "asc" },
            });
            expect(result).toBe(nearbyStations);
        });

        it("DBエラー時はhandleDatabaseErrorにより汎用エラーへ変換される", async () => {
            prisma.nearbyStations.findMany.mockRejectedValue(new Error("timeout"));

            await expect(repository.findFromStation("STATION_A")).rejects.toThrow(
                "Database operation failed: findFromStation",
            );
        });
    });

    describe("findToStation", () => {
        it("到着駅コードで絞り込み、所要時間の昇順で取得する", async () => {
            const nearbyStations = buildBidirectionalNearbyStations([["STATION_A", "STATION_B", 5]]);
            prisma.nearbyStations.findMany.mockResolvedValue(nearbyStations);

            const result = await repository.findToStation("STATION_B");

            expect(prisma.nearbyStations.findMany).toHaveBeenCalledWith({
                where: { toStationCode: "STATION_B" },
                include: { fromStation: true, toStation: true },
                orderBy: { timeMinutes: "asc" },
            });
            expect(result).toBe(nearbyStations);
        });
    });

    describe("findConnection", () => {
        it("出発駅コードと到着駅コードの組み合わせで接続情報を取得する", async () => {
            const connection = buildNearbyStation("STATION_A", "STATION_B", 5);
            prisma.nearbyStations.findFirst.mockResolvedValue(connection);

            const result = await repository.findConnection("STATION_A", "STATION_B");

            expect(prisma.nearbyStations.findFirst).toHaveBeenCalledWith({
                where: { fromStationCode: "STATION_A", toStationCode: "STATION_B" },
            });
            expect(result).toBe(connection);
        });

        it("該当する接続がない場合はnullを返す", async () => {
            prisma.nearbyStations.findFirst.mockResolvedValue(null);

            const result = await repository.findConnection("STATION_A", "STATION_Z");

            expect(result).toBeNull();
        });
    });

    describe("findByEventTypeCode", () => {
        it("イベント種別コードで絞り込んで取得する", async () => {
            const nearbyStations = buildBidirectionalNearbyStations([["STATION_A", "STATION_B", 5]]);
            prisma.nearbyStations.findMany.mockResolvedValue(nearbyStations);

            const result = await repository.findByEventTypeCode(TEST_EVENT_TYPE_CODE);

            expect(prisma.nearbyStations.findMany).toHaveBeenCalledWith({
                where: { eventTypeCode: TEST_EVENT_TYPE_CODE },
                include: { fromStation: true, toStation: true },
            });
            expect(result).toBe(nearbyStations);
        });
    });

    describe("create", () => {
        it("渡された接続データで近隣駅接続を新規作成する", async () => {
            const connectionData = {
                fromStationCode: "STATION_A",
                toStationCode: "STATION_B",
                eventTypeCode: TEST_EVENT_TYPE_CODE,
                timeMinutes: 5,
            };
            const created = buildNearbyStation("STATION_A", "STATION_B", 5);
            prisma.nearbyStations.create.mockResolvedValue(created);

            const result = await repository.create(connectionData);

            expect(prisma.nearbyStations.create).toHaveBeenCalledWith({ data: connectionData });
            expect(result).toBe(created);
        });
    });

    describe("update", () => {
        it("指定したIDの接続情報（所要時間）を更新する", async () => {
            const updated = buildNearbyStation("STATION_A", "STATION_B", 10, { id: 3 });
            prisma.nearbyStations.update.mockResolvedValue(updated);

            const result = await repository.update(3, { timeMinutes: 10 });

            expect(prisma.nearbyStations.update).toHaveBeenCalledWith({
                where: { id: 3 },
                data: { timeMinutes: 10 },
            });
            expect(result).toBe(updated);
        });
    });

    describe("delete", () => {
        it("指定したIDの近隣駅接続を削除する", async () => {
            const deleted = buildNearbyStation("STATION_A", "STATION_B", 5, { id: 9 });
            prisma.nearbyStations.delete.mockResolvedValue(deleted);

            const result = await repository.delete(9);

            expect(prisma.nearbyStations.delete).toHaveBeenCalledWith({ where: { id: 9 } });
            expect(result).toBe(deleted);
        });
    });

    describe("deleteConnection", () => {
        it("接続が存在する場合はそのIDで削除する", async () => {
            const connection = buildNearbyStation("STATION_A", "STATION_B", 5, { id: 7 });
            prisma.nearbyStations.findFirst.mockResolvedValue(connection);
            const deleted = { ...connection };
            prisma.nearbyStations.delete.mockResolvedValue(deleted);

            const result = await repository.deleteConnection("STATION_A", "STATION_B");

            expect(prisma.nearbyStations.findFirst).toHaveBeenCalledWith({
                where: { fromStationCode: "STATION_A", toStationCode: "STATION_B" },
            });
            expect(prisma.nearbyStations.delete).toHaveBeenCalledWith({ where: { id: 7 } });
            expect(result).toBe(deleted);
        });

        it("接続が存在しない場合は削除を行わずnullを返す", async () => {
            prisma.nearbyStations.findFirst.mockResolvedValue(null);

            const result = await repository.deleteConnection("STATION_A", "STATION_Z");

            expect(prisma.nearbyStations.delete).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });
    });
});
