/**
 * @jest-environment node
 */

import { EventsRepository } from "@/repositories/events/EventsRepository";
import {
    buildEvent,
    buildEventType,
    buildTeam,
    buildStations,
    buildGoalStation,
    buildTransitStation,
    buildBombiiHistory,
} from "../../helpers/factories";
import { createPrismaMock, MockPrismaClient } from "../../helpers/prismaMock";

describe("EventsRepository", () => {
    let prisma: MockPrismaClient;
    let repository: EventsRepository;

    beforeEach(() => {
        prisma = createPrismaMock();
        repository = new EventsRepository(prisma);
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("findByEventCode", () => {
        it("イベントコードに完全一致するイベントを取得する", async () => {
            const event = buildEvent();
            prisma.events.findUniqueOrThrow.mockResolvedValue(event);

            const result = await repository.findByEventCode("TEST_EVENT");

            expect(prisma.events.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT" },
            });
            expect(result).toBe(event);
        });

        it("DBエラー時はhandleDatabaseErrorにより汎用エラーへ変換される", async () => {
            prisma.events.findUniqueOrThrow.mockRejectedValue(new Error("not found"));

            await expect(repository.findByEventCode("TEST_EVENT")).rejects.toThrow(
                "Database operation failed: findByEventCode",
            );
        });
    });

    describe("findByEventCodeWithRelations", () => {
        it("イベント種別・チーム・目的駅・経由駅・ボンビー履歴を含めて取得する", async () => {
            const [stationA] = buildStations(["STATION_A"]);
            const relations = {
                ...buildEvent(),
                eventType: buildEventType(),
                teams: [buildTeam()],
                goalStations: [{ ...buildGoalStation(), station: stationA }],
                transitStations: [{ ...buildTransitStation(), station: stationA }],
                bombiiHistories: [{ ...buildBombiiHistory(), team: buildTeam() }],
            };
            prisma.events.findUnique.mockResolvedValue(relations);

            const result = await repository.findByEventCodeWithRelations("TEST_EVENT");

            expect(prisma.events.findUnique).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT" },
                include: {
                    eventType: true,
                    teams: true,
                    goalStations: { include: { station: true } },
                    transitStations: { include: { station: true } },
                    bombiiHistories: { include: { team: true } },
                },
            });
            expect(result).toBe(relations);
        });
    });

    describe("findAll", () => {
        it("イベント種別を含めて作成日時の降順ですべてのイベントを取得する", async () => {
            const events = [buildEvent({ id: 1 }), buildEvent({ id: 2 })];
            prisma.events.findMany.mockResolvedValue(events);

            const result = await repository.findAll();

            expect(prisma.events.findMany).toHaveBeenCalledWith({
                include: { eventType: true },
                orderBy: { createdAt: "desc" },
            });
            expect(result).toBe(events);
        });
    });

    describe("findByEventTypeCode", () => {
        it("イベント種別コードで絞り込み、開始日の降順で取得する", async () => {
            const events = [buildEvent()];
            prisma.events.findMany.mockResolvedValue(events);

            const result = await repository.findByEventTypeCode("TEST_V1");

            expect(prisma.events.findMany).toHaveBeenCalledWith({
                where: { eventTypeCode: "TEST_V1" },
                include: { eventType: true },
                orderBy: { startDate: "desc" },
            });
            expect(result).toBe(events);
        });
    });

    describe("create", () => {
        it("渡されたデータでイベントを作成する", async () => {
            const eventData = {
                eventCode: "NEW_EVENT",
                eventTypeCode: "TEST_V1",
                eventName: "新規イベント",
            };
            const created = buildEvent(eventData);
            prisma.events.create.mockResolvedValue(created);

            const result = await repository.create(eventData);

            expect(prisma.events.create).toHaveBeenCalledWith({ data: eventData });
            expect(result).toBe(created);
        });
    });

    describe("update", () => {
        it("イベントコードを指定して更新データを反映する", async () => {
            const updateData = { eventName: "更新後イベント" };
            const updated = buildEvent(updateData);
            prisma.events.update.mockResolvedValue(updated);

            const result = await repository.update("TEST_EVENT", updateData);

            expect(prisma.events.update).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT" },
                data: updateData,
            });
            expect(result).toBe(updated);
        });
    });

    describe("delete", () => {
        it("イベントコードを指定してイベントを削除する", async () => {
            const deleted = buildEvent();
            prisma.events.delete.mockResolvedValue(deleted);

            const result = await repository.delete("TEST_EVENT");

            expect(prisma.events.delete).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT" },
            });
            expect(result).toBe(deleted);
        });
    });

    describe("findByDateRange", () => {
        it("開始日の範囲で絞り込み、開始日の昇順で取得する", async () => {
            const startDate = new Date("2026-01-01T00:00:00.000Z");
            const endDate = new Date("2026-01-31T00:00:00.000Z");
            const events = [buildEvent()];
            prisma.events.findMany.mockResolvedValue(events);

            const result = await repository.findByDateRange(startDate, endDate);

            expect(prisma.events.findMany).toHaveBeenCalledWith({
                where: {
                    startDate: {
                        gte: startDate,
                        lte: endDate,
                    },
                },
                include: { eventType: true },
                orderBy: { startDate: "asc" },
            });
            expect(result).toBe(events);
        });
    });
});
