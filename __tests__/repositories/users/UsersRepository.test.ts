/**
 * @jest-environment node
 */

import { UsersRepository } from "@/repositories/users/UsersRepository";
import { Role } from "@/generated/prisma";
import { buildUser, buildAttendance, buildEvent, buildEventType } from "../../helpers/factories";
import { createPrismaMock, MockPrismaClient } from "../../helpers/prismaMock";

describe("UsersRepository", () => {
    let prisma: MockPrismaClient;
    let repository: UsersRepository;

    beforeEach(() => {
        prisma = createPrismaMock();
        repository = new UsersRepository(prisma);
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("findByUuid", () => {
        it("UUIDに完全一致するユーザーを、開始日のあるイベントの参加情報を開始日降順で含めて取得する", async () => {
            const userWithRelations = {
                ...buildUser(),
                attendances: [
                    {
                        ...buildAttendance(),
                        event: { ...buildEvent(), eventType: buildEventType() },
                    },
                ],
            };
            prisma.users.findUniqueOrThrow.mockResolvedValue(userWithRelations);

            const result = await repository.findByUuid("00000000-0000-0000-0000-000000000001");

            expect(prisma.users.findUniqueOrThrow).toHaveBeenCalledWith({
                where: { uuid: "00000000-0000-0000-0000-000000000001" },
                include: {
                    attendances: {
                        include: {
                            event: {
                                include: {
                                    eventType: true,
                                },
                            },
                        },
                        where: {
                            event: {
                                startDate: {
                                    not: null,
                                },
                            },
                        },
                        orderBy: {
                            event: {
                                startDate: "desc",
                            },
                        },
                    },
                },
            });
            expect(result).toBe(userWithRelations);
        });

        it("DBエラー時はhandleDatabaseErrorにより汎用エラーへ変換される", async () => {
            prisma.users.findUniqueOrThrow.mockRejectedValue(new Error("not found"));

            await expect(repository.findByUuid("00000000-0000-0000-0000-000000000001")).rejects.toThrow(
                "Database operation failed: findByUuid",
            );
        });
    });

    describe("create", () => {
        it("渡されたデータでユーザーを作成する", async () => {
            const userData = {
                uuid: "00000000-0000-0000-0000-000000000002",
                email: "new@example.com",
                nickname: "新規ユーザー",
            };
            const created = buildUser(userData);
            prisma.users.create.mockResolvedValue(created);

            const result = await repository.create(userData);

            expect(prisma.users.create).toHaveBeenCalledWith({ data: userData });
            expect(result).toBe(created);
        });

        it("ロールを含むデータが渡された場合もそのまま作成データとして使用する", async () => {
            const userData = {
                uuid: "00000000-0000-0000-0000-000000000003",
                email: "admin@example.com",
                role: Role.admin,
            };
            prisma.users.create.mockResolvedValue(buildUser(userData));

            await repository.create(userData);

            expect(prisma.users.create).toHaveBeenCalledWith({ data: userData });
        });
    });

    describe("updateByUuid", () => {
        it("UUIDを指定して更新し、更新後のユーザーを関連データと一緒に取得し直す", async () => {
            const uuid = "00000000-0000-0000-0000-000000000001";
            const updateData = { nickname: "更新後ニックネーム" };
            const updated = buildUser({ uuid, ...updateData });
            const userWithRelations = { ...updated, attendances: [] };
            prisma.users.update.mockResolvedValue(updated);
            prisma.users.findUniqueOrThrow.mockResolvedValue(userWithRelations);

            const result = await repository.updateByUuid(uuid, updateData);

            expect(prisma.users.update).toHaveBeenCalledWith({
                where: { uuid },
                data: updateData,
            });
            expect(prisma.users.findUniqueOrThrow).toHaveBeenCalledWith(
                expect.objectContaining({ where: { uuid } }),
            );
            expect(result).toBe(userWithRelations);
        });

        it("DBエラー時はhandleDatabaseErrorにより汎用エラーへ変換される", async () => {
            prisma.users.update.mockRejectedValue(new Error("Unique constraint failed"));

            await expect(
                repository.updateByUuid("00000000-0000-0000-0000-000000000001", { email: "dup@example.com" }),
            ).rejects.toThrow("Duplicate entry in updateByUuid");
        });
    });
});
