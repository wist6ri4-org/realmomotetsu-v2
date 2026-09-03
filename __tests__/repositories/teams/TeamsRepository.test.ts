/**
 * @jest-environment node
 */

import { TeamsRepository } from "@/repositories/teams/TeamsRepository";
import { buildTeam, buildTransitStation, buildStations } from "../../helpers/factories";
import { createPrismaMock, MockPrismaClient } from "../../helpers/prismaMock";

describe("TeamsRepository", () => {
    let prisma: MockPrismaClient;
    let repository: TeamsRepository;

    beforeEach(() => {
        prisma = createPrismaMock();
        repository = new TeamsRepository(prisma);
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("findByEventCode", () => {
        it("イベントコードで絞り込み、経由駅を新しい順に含めてID昇順で取得する", async () => {
            const [stationA] = buildStations(["STATION_A"]);
            const teams = [
                {
                    ...buildTeam(),
                    transitStations: [{ ...buildTransitStation(), station: stationA }],
                },
            ];
            prisma.teams.findMany.mockResolvedValue(teams);

            const result = await repository.findByEventCode("TEST_EVENT");

            expect(prisma.teams.findMany).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT" },
                include: {
                    transitStations: {
                        include: { station: true },
                        orderBy: { id: "desc" },
                    },
                },
                orderBy: { id: "asc" },
            });
            expect(result).toBe(teams);
        });

        it("DBエラー時はhandleDatabaseErrorにより汎用エラーへ変換される", async () => {
            prisma.teams.findMany.mockRejectedValue(new Error("timeout"));

            await expect(repository.findByEventCode("TEST_EVENT")).rejects.toThrow(
                "Database operation failed: findByEventCode",
            );
        });
    });

    describe("findByTeamCode", () => {
        it("チームコードに完全一致するチームを取得する", async () => {
            const team = buildTeam();
            prisma.teams.findUnique.mockResolvedValue(team);

            const result = await repository.findByTeamCode("TEAM_A");

            expect(prisma.teams.findUnique).toHaveBeenCalledWith({
                where: { teamCode: "TEAM_A" },
            });
            expect(result).toBe(team);
        });

        it("該当するチームが存在しない場合はnullを返す", async () => {
            prisma.teams.findUnique.mockResolvedValue(null);

            const result = await repository.findByTeamCode("UNKNOWN");

            expect(result).toBeNull();
        });
    });

    describe("create", () => {
        it("渡されたデータでチームを作成する", async () => {
            const teamData = {
                teamCode: "NEW_TEAM",
                teamName: "新規チーム",
                eventCode: "TEST_EVENT",
            };
            const created = buildTeam(teamData);
            prisma.teams.create.mockResolvedValue(created);

            const result = await repository.create(teamData);

            expect(prisma.teams.create).toHaveBeenCalledWith({ data: teamData });
            expect(result).toBe(created);
        });
    });

    describe("update", () => {
        it("IDを指定して更新データを反映する", async () => {
            const updateData = { teamName: "更新後チーム", teamColor: "#00ff00" };
            const updated = buildTeam(updateData);
            prisma.teams.update.mockResolvedValue(updated);

            const result = await repository.update(1, updateData);

            expect(prisma.teams.update).toHaveBeenCalledWith({
                where: { id: 1 },
                data: updateData,
            });
            expect(result).toBe(updated);
        });
    });

    describe("delete", () => {
        it("IDを指定してチームを削除する", async () => {
            const deleted = buildTeam({ id: 9 });
            prisma.teams.delete.mockResolvedValue(deleted);

            const result = await repository.delete(9);

            expect(prisma.teams.delete).toHaveBeenCalledWith({ where: { id: 9 } });
            expect(result).toBe(deleted);
        });
    });
});
