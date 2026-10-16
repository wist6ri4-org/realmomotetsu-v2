/**
 * @jest-environment node
 */

import { AttendancesRepository } from "@/repositories/attendances/AttendancesRepository";
import { buildAttendance } from "../../helpers/factories";
import { createPrismaMock, MockPrismaClient } from "../../helpers/prismaMock";

describe("AttendancesRepository", () => {
    let prisma: MockPrismaClient;
    let repository: AttendancesRepository;

    beforeEach(() => {
        prisma = createPrismaMock();
        repository = new AttendancesRepository(prisma);
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("findByEventCode", () => {
        it("イベントコードで絞り込み、ユーザー情報を含めてチームコード・ID順の昇順で取得する", async () => {
            const attendances = [
                { ...buildAttendance({ id: 1, teamCode: "TEAM_A" }), user: { nickname: "a", iconUrl: null } },
                { ...buildAttendance({ id: 2, teamCode: "TEAM_B" }), user: { nickname: "b", iconUrl: null } },
            ];
            prisma.attendances.findMany.mockResolvedValue(attendances as never);

            const result = await repository.findByEventCode("TEST_EVENT");

            expect(prisma.attendances.findMany).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT" },
                include: { user: { select: { uuid: true, nickname: true, iconUrl: true } } },
                orderBy: [{ teamCode: "asc" }, { id: "asc" }],
            });
            expect(result).toBe(attendances);
        });

        it("参加者がいない場合は空配列を返す", async () => {
            prisma.attendances.findMany.mockResolvedValue([]);

            await expect(repository.findByEventCode("TEST_EVENT")).resolves.toEqual([]);
        });

        it("DBエラー時はhandleDatabaseErrorにより汎用エラーへ変換される", async () => {
            prisma.attendances.findMany.mockRejectedValue(new Error("timeout"));

            await expect(repository.findByEventCode("TEST_EVENT")).rejects.toThrow(
                "Database operation failed: findByEventCode",
            );
        });
    });
});
