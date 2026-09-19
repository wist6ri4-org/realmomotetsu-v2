/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { UsersByUuidServiceImpl } from "@/features/users/[uuid]/service";
import { UsersWithRelations } from "@/repositories/users/UsersRepository";
import { buildUser } from "../../../helpers/factories";
import { mockRepositories } from "../../../helpers/repositoryMocks";

/** テストで使う共通のUUID */
const TEST_UUID = "00000000-0000-0000-0000-000000000001";

/**
 * リレーション付きユーザーを生成する
 * @param {Partial<UsersWithRelations>} overrides - 上書きする項目
 * @return {UsersWithRelations} リレーション付きユーザー
 */
const buildUserWithRelations = (overrides: Partial<UsersWithRelations> = {}): UsersWithRelations => ({
    ...buildUser(overrides),
    attendances: [],
    ...overrides,
});

describe("UsersByUuidServiceImpl", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findByUuid: jest.Mock;
    let updateByUuid: jest.Mock;

    beforeEach(() => {
        findByUuid = jest.fn().mockResolvedValue(buildUserWithRelations({ uuid: TEST_UUID }));
        updateByUuid = jest.fn().mockImplementation(async (uuid, data) => buildUserWithRelations({ uuid, ...data }));

        mockRepositories({ users: { findByUuid, updateByUuid } });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getUsersByUuid", () => {
        it("UUIDで取得したユーザー情報をそのまま返す", async () => {
            const user = buildUserWithRelations({ uuid: TEST_UUID, nickname: "テスト太郎" });
            findByUuid.mockResolvedValue(user);

            const res = await UsersByUuidServiceImpl.getUsersByUuid({ uuid: TEST_UUID });

            expect(findByUuid).toHaveBeenCalledWith(TEST_UUID);
            expect(res.user).toEqual(user);
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            findByUuid.mockRejectedValue(new Error("DB connection lost"));

            await expect(UsersByUuidServiceImpl.getUsersByUuid({ uuid: TEST_UUID })).rejects.toThrow(
                InternalServerError,
            );
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "conflict" });
            findByUuid.mockRejectedValue(apiError);

            await expect(UsersByUuidServiceImpl.getUsersByUuid({ uuid: TEST_UUID })).rejects.toBe(apiError);
        });
    });

    describe("putUsersByUuid", () => {
        it("リクエストからuuidを除いた項目で更新する", async () => {
            const res = await UsersByUuidServiceImpl.putUsersByUuid({
                uuid: TEST_UUID,
                nickname: "新しい名前",
                email: "new@example.com",
            });

            expect(updateByUuid).toHaveBeenCalledWith(TEST_UUID, {
                nickname: "新しい名前",
                email: "new@example.com",
            });
            expect(res.user).toMatchObject({ nickname: "新しい名前", email: "new@example.com" });
        });

        it("undefinedの項目は更新データから除外する", async () => {
            await UsersByUuidServiceImpl.putUsersByUuid({
                uuid: TEST_UUID,
                nickname: "新しい名前",
                email: undefined,
                iconUrl: undefined,
            });

            expect(updateByUuid).toHaveBeenCalledWith(TEST_UUID, { nickname: "新しい名前" });
        });

        it("更新項目が1つもない場合は空オブジェクトで更新する", async () => {
            await UsersByUuidServiceImpl.putUsersByUuid({ uuid: TEST_UUID });

            expect(updateByUuid).toHaveBeenCalledWith(TEST_UUID, {});
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            updateByUuid.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                UsersByUuidServiceImpl.putUsersByUuid({ uuid: TEST_UUID, nickname: "新しい名前" }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "already exists" });
            updateByUuid.mockRejectedValue(apiError);

            await expect(
                UsersByUuidServiceImpl.putUsersByUuid({ uuid: TEST_UUID, nickname: "新しい名前" }),
            ).rejects.toBe(apiError);
        });
    });
});
