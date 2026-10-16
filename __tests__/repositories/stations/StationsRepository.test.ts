/**
 * @jest-environment node
 */

import { StationsRepository } from "@/repositories/stations/StationsRepository";
import { buildStation, buildStations, TEST_EVENT_TYPE_CODE } from "../../helpers/factories";
import { createPrismaMock, MockPrismaClient } from "../../helpers/prismaMock";

describe("StationsRepository", () => {
    let prisma: MockPrismaClient;
    let repository: StationsRepository;

    beforeEach(() => {
        prisma = createPrismaMock();
        repository = new StationsRepository(prisma);
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("findByStationCode", () => {
        it("駅コードに一致する駅を取得する", async () => {
            const station = buildStation({ stationCode: "STATION_A" });
            prisma.stations.findUnique.mockResolvedValue(station);

            const result = await repository.findByStationCode("STATION_A");

            expect(prisma.stations.findUnique).toHaveBeenCalledWith({
                where: { stationCode: "STATION_A" },
            });
            expect(result).toBe(station);
        });

        it("DBエラー時はhandleDatabaseErrorにより汎用エラーへ変換される", async () => {
            prisma.stations.findUnique.mockRejectedValue(new Error("timeout"));

            await expect(repository.findByStationCode("STATION_A")).rejects.toThrow(
                "Database operation failed: findByStationCode",
            );
        });
    });

    describe("findByStationCodeWithRelations", () => {
        it("駅コードに一致する駅を関連データ込みで取得する", async () => {
            const station = buildStation({ stationCode: "STATION_A" });
            prisma.stations.findUnique.mockResolvedValue(station);

            const result = await repository.findByStationCodeWithRelations("STATION_A");

            expect(prisma.stations.findUnique).toHaveBeenCalledWith({
                where: { stationCode: "STATION_A" },
                include: {
                    eventType: true,
                    fromStations: { include: { toStation: true } },
                    toStations: { include: { fromStation: true } },
                    goalStations: true,
                    transitStations: true,
                },
            });
            expect(result).toBe(station);
        });
    });

    describe("findByEventTypeCode", () => {
        it("イベント種別コードで絞り込み、かな昇順で取得する", async () => {
            const stations = buildStations(["STATION_A", "STATION_B"]);
            prisma.stations.findMany.mockResolvedValue(stations);

            const result = await repository.findByEventTypeCode(TEST_EVENT_TYPE_CODE);

            expect(prisma.stations.findMany).toHaveBeenCalledWith({
                where: { eventTypeCode: TEST_EVENT_TYPE_CODE },
                orderBy: { kana: "asc" },
            });
            expect(result).toBe(stations);
        });
    });

    describe("findByEventTypeCodeWithRelations", () => {
        it("イベント種別コードで絞り込み、関連データ込みで名前昇順で取得する", async () => {
            const stations = buildStations(["STATION_A", "STATION_B"]);
            prisma.stations.findMany.mockResolvedValue(stations);

            const result = await repository.findByEventTypeCodeWithRelations(TEST_EVENT_TYPE_CODE);

            expect(prisma.stations.findMany).toHaveBeenCalledWith({
                where: { eventTypeCode: TEST_EVENT_TYPE_CODE },
                include: {
                    eventType: true,
                    fromStations: { include: { toStation: true } },
                    toStations: { include: { fromStation: true } },
                    goalStations: true,
                    transitStations: true,
                },
                orderBy: { name: "asc" },
            });
            expect(result).toBe(stations);
        });
    });

    describe("searchByName", () => {
        it("駅名またはかなの部分一致（大文字小文字を区別しない）で検索する", async () => {
            const stations = [buildStation({ name: "駅A" })];
            prisma.stations.findMany.mockResolvedValue(stations);

            const result = await repository.searchByName("えき");

            expect(prisma.stations.findMany).toHaveBeenCalledWith({
                where: {
                    OR: [
                        { name: { contains: "えき", mode: "insensitive" } },
                        { kana: { contains: "えき", mode: "insensitive" } },
                    ],
                },
                orderBy: { name: "asc" },
            });
            expect(result).toBe(stations);
        });
    });

    describe("findMissionStations", () => {
        it("イベント種別コードとミッション設定済みで絞り込んで取得する", async () => {
            const stations = [buildStation({ isMissionSet: true })];
            prisma.stations.findMany.mockResolvedValue(stations);

            const result = await repository.findMissionStations(TEST_EVENT_TYPE_CODE);

            expect(prisma.stations.findMany).toHaveBeenCalledWith({
                where: { eventTypeCode: TEST_EVENT_TYPE_CODE, isMissionSet: true },
                orderBy: { name: "asc" },
            });
            expect(result).toBe(stations);
        });
    });

    describe("create", () => {
        it("渡されたデータで駅を新規作成する", async () => {
            const stationData = {
                stationCode: "STATION_C",
                name: "駅C",
                kana: "えきしー",
                englishName: "Station C",
                eventTypeCode: TEST_EVENT_TYPE_CODE,
            };
            const created = buildStation(stationData);
            prisma.stations.create.mockResolvedValue(created);

            const result = await repository.create(stationData);

            expect(prisma.stations.create).toHaveBeenCalledWith({ data: stationData });
            expect(result).toBe(created);
        });
    });

    describe("update", () => {
        it("指定したIDの駅情報を更新する", async () => {
            const updateData = { stationCode: "STATION_A", name: "駅A改" };
            const updated = buildStation(updateData);
            prisma.stations.update.mockResolvedValue(updated);

            const result = await repository.update(1, updateData);

            expect(prisma.stations.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateData,
            });
            expect(result).toBe(updated);
        });
    });

    describe("delete", () => {
        it("指定したIDの駅を削除する", async () => {
            const deleted = buildStation({ id: 9 });
            prisma.stations.delete.mockResolvedValue(deleted);

            const result = await repository.delete(9);

            expect(prisma.stations.delete).toHaveBeenCalledWith({ where: { id: 9 } });
            expect(result).toBe(deleted);
        });
    });
});
