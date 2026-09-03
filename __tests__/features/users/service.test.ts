/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { Role } from "@/generated/prisma";
import { UsersServiceImpl } from "@/features/users/service";
import { buildUser } from "../../helpers/factories";
import { mockRepositories } from "../../helpers/repositoryMocks";

describe("UsersServiceImpl", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let create: jest.Mock;

    beforeEach(() => {
        create = jest.fn().mockImplementation(async (data) => buildUser(data));

        mockRepositories({ users: { create } });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("postUsers", () => {
        it("リクエストの内容でユーザーを登録する", async () => {
            const req = {
                uuid: "00000000-0000-0000-0000-000000000099",
                email: "new-user@example.com",
                nickname: "新しいユーザー",
                role: Role.admin,
            };

            const res = await UsersServiceImpl.postUsers(req);

            expect(create).toHaveBeenCalledWith({
                uuid: req.uuid,
                email: req.email,
                nickname: req.nickname,
                role: req.role,
            });
            expect(res.user).toMatchObject(req);
        });

        it("nicknameとroleを指定しない場合はundefinedのままRepositoryへ渡す", async () => {
            const req = {
                uuid: "00000000-0000-0000-0000-000000000099",
                email: "new-user@example.com",
            };

            await UsersServiceImpl.postUsers(req);

            expect(create).toHaveBeenCalledWith({
                uuid: req.uuid,
                email: req.email,
                nickname: undefined,
                role: undefined,
            });
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            create.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                UsersServiceImpl.postUsers({
                    uuid: "00000000-0000-0000-0000-000000000099",
                    email: "new-user@example.com",
                }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "already exists" });
            create.mockRejectedValue(apiError);

            await expect(
                UsersServiceImpl.postUsers({
                    uuid: "00000000-0000-0000-0000-000000000099",
                    email: "new-user@example.com",
                }),
            ).rejects.toBe(apiError);
        });
    });
});
