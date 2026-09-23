/**
 * @jest-environment node
 */

import { EventTypesRepository } from "@/repositories/eventTypes/EventTypesRepository";
import { buildEventType, buildEvent, buildStations } from "../../helpers/factories";
import { createPrismaMock, MockPrismaClient } from "../../helpers/prismaMock";

describe("EventTypesRepository", () => {
    let prisma: MockPrismaClient;
    let repository: EventTypesRepository;

    beforeEach(() => {
        prisma = createPrismaMock();
        repository = new EventTypesRepository(prisma);
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("findByEventTypeCode", () => {
        it("イベント種別コードに完全一致するイベント種別を取得する", async () => {
            const eventType = buildEventType();
            prisma.eventTypes.findUnique.mockResolvedValue(eventType);

            const result = await repository.findByEventTypeCode("TEST_V1");

            expect(prisma.eventTypes.findUnique).toHaveBeenCalledWith({
                where: { eventTypeCode: "TEST_V1" },
            });
            expect(result).toBe(eventType);
        });

        it("該当するイベント種別が存在しない場合はnullを返す", async () => {
            prisma.eventTypes.findUnique.mockResolvedValue(null);

            const result = await repository.findByEventTypeCode("UNKNOWN");

            expect(result).toBeNull();
        });

        it("DBエラー時はhandleDatabaseErrorにより汎用エラーへ変換される", async () => {
            prisma.eventTypes.findUnique.mockRejectedValue(new Error("timeout"));

            await expect(repository.findByEventTypeCode("TEST_V1")).rejects.toThrow(
                "Database operation failed: findByEventTypeCode",
            );
        });
    });

    describe("findByEventTypeCodeWithRelations", () => {
        it("紐づくイベントと駅を含めて取得する", async () => {
            const relations = {
                ...buildEventType(),
                events: [buildEvent()],
                stations: buildStations(["STATION_A", "STATION_B"]),
            };
            prisma.eventTypes.findUnique.mockResolvedValue(relations);

            const result = await repository.findByEventTypeCodeWithRelations("TEST_V1");

            expect(prisma.eventTypes.findUnique).toHaveBeenCalledWith({
                where: { eventTypeCode: "TEST_V1" },
                include: { events: true, stations: true },
            });
            expect(result).toBe(relations);
        });

        it("該当するイベント種別が存在しない場合はnullを返す", async () => {
            prisma.eventTypes.findUnique.mockResolvedValue(null);

            const result = await repository.findByEventTypeCodeWithRelations("UNKNOWN");

            expect(result).toBeNull();
        });
    });

    describe("findAll", () => {
        it("イベント種別コードの昇順ですべてのイベント種別を取得する", async () => {
            const eventTypes = [buildEventType({ id: 1 }), buildEventType({ id: 2 })];
            prisma.eventTypes.findMany.mockResolvedValue(eventTypes);

            const result = await repository.findAll();

            expect(prisma.eventTypes.findMany).toHaveBeenCalledWith({
                orderBy: { eventTypeCode: "asc" },
            });
            expect(result).toBe(eventTypes);
        });
    });

    describe("findById", () => {
        it("IDに一致するイベント種別を取得する", async () => {
            const eventType = buildEventType({ id: 5 });
            prisma.eventTypes.findUnique.mockResolvedValue(eventType);

            const result = await repository.findById(5);

            expect(prisma.eventTypes.findUnique).toHaveBeenCalledWith({
                where: { id: 5 },
            });
            expect(result).toBe(eventType);
        });
    });

    describe("create", () => {
        it("渡されたデータでイベント種別を作成する", async () => {
            const eventTypeData = { eventTypeCode: "NEW_TYPE", description: "新規種別" };
            const created = buildEventType(eventTypeData);
            prisma.eventTypes.create.mockResolvedValue(created);

            const result = await repository.create(eventTypeData);

            expect(prisma.eventTypes.create).toHaveBeenCalledWith({ data: eventTypeData });
            expect(result).toBe(created);
        });
    });

    describe("update", () => {
        it("IDを指定して更新データを反映する", async () => {
            const updateData = { description: "更新後の説明" };
            const updated = buildEventType(updateData);
            prisma.eventTypes.update.mockResolvedValue(updated);

            const result = await repository.update(1, updateData);

            expect(prisma.eventTypes.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateData,
            });
            expect(result).toBe(updated);
        });
    });

    describe("delete", () => {
        it("IDを指定してイベント種別を削除する", async () => {
            const deleted = buildEventType({ id: 9 });
            prisma.eventTypes.delete.mockResolvedValue(deleted);

            const result = await repository.delete(9);

            expect(prisma.eventTypes.delete).toHaveBeenCalledWith({ where: { id: 9 } });
            expect(result).toBe(deleted);
        });
    });

    describe("searchByDescription", () => {
        it("説明文を大文字小文字を区別せず部分一致検索し、コードの昇順で取得する", async () => {
            const eventTypes = [buildEventType()];
            prisma.eventTypes.findMany.mockResolvedValue(eventTypes);

            const result = await repository.searchByDescription("テスト");

            expect(prisma.eventTypes.findMany).toHaveBeenCalledWith({
                where: {
                    description: {
                        contains: "テスト",
                        mode: "insensitive",
                    },
                },
                orderBy: { eventTypeCode: "asc" },
            });
            expect(result).toBe(eventTypes);
        });
    });
});
