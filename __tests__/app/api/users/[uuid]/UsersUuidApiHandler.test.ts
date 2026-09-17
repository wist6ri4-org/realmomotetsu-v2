/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { BadRequestError, ConflictError, ResourceNotFoundError } from "@/error";
import { Role } from "@/generated/prisma";
import { StatusCode } from "@/constants/statuscode";
import { buildUserWithRelations, TEST_USER_UUID } from "../../../../helpers/factories";
import { buildGetRequest, mockApiAuth, readResponse, silenceApiLogs } from "../../../../helpers/apiRequest";

/** テスト対象のUUID（既定では認証したユーザーのuuidと一致させる） */
const TEST_UUID = TEST_USER_UUID;

/** テスト用のベースURL */
const BASE_URL = "http://localhost:3001/api/test";

/**
 * JSONボディを持つPUTリクエストを生成する（認証ヘッダーはbuildGetRequestと同じものを既定で付与する）
 * @param {unknown} body - リクエストボディ
 * @return {NextRequest} リクエスト
 */
const buildPutRequest = (body: unknown): NextRequest =>
    new NextRequest(new URL(BASE_URL), {
        method: "PUT",
        headers: { "content-type": "application/json", authorization: "Bearer test-access-token" },
        body: typeof body === "string" ? body : JSON.stringify(body),
    });

// UsersUuidApiHandlerはUsersByUuidServiceImplを直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/users/[uuid]/service", () => ({
    UsersByUuidServiceImpl: {
        getUsersByUuid: jest.fn(),
        putUsersByUuid: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { UsersByUuidServiceImpl } = jest.requireMock("@/features/users/[uuid]/service") as {
    UsersByUuidServiceImpl: {
        getUsersByUuid: jest.Mock;
        putUsersByUuid: jest.Mock;
    };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import UsersUuidApiHandler from "@/app/api/users/[uuid]/UsersUuidApiHandler";

describe("UsersUuidApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        mockApiAuth();
        UsersByUuidServiceImpl.getUsersByUuid.mockReset();
        UsersByUuidServiceImpl.putUsersByUuid.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("GET", () => {
        it("パスパラメータのuuidをServiceに渡し、ユーザー情報を返す", async () => {
            UsersByUuidServiceImpl.getUsersByUuid.mockResolvedValue({
                user: buildUserWithRelations({ uuid: TEST_UUID }),
            });

            const req = buildGetRequest();
            const { status, body } = await readResponse(
                await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle()
            );

            expect(UsersByUuidServiceImpl.getUsersByUuid).toHaveBeenCalledWith({ uuid: TEST_UUID });
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it("uuidが空文字の場合は400を返し、Serviceを呼ばない", async () => {
            const req = buildGetRequest();
            const { status, body } = await readResponse(await new UsersUuidApiHandler(req, { uuid: "" }).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
            expect(UsersByUuidServiceImpl.getUsersByUuid).not.toHaveBeenCalled();
        });

        it("認証済みユーザー本人以外のuuidを指定した場合は403を返し、Serviceを呼ばない", async () => {
            const req = buildGetRequest();
            const { status, body } = await readResponse(
                await new UsersUuidApiHandler(req, { uuid: "other-users-uuid" }).handle()
            );

            expect(status).toBe(StatusCode.FORBIDDEN);
            expect(body.errorCode).toBe("USER_PROFILE_ACCESS_DENIED");
            expect(UsersByUuidServiceImpl.getUsersByUuid).not.toHaveBeenCalled();
        });

        it("master adminは他ユーザーのuuidを指定しても閲覧できる", async () => {
            mockApiAuth({ user: buildUserWithRelations({ masterRole: Role.admin }) });
            UsersByUuidServiceImpl.getUsersByUuid.mockResolvedValue({
                user: buildUserWithRelations({ uuid: "other-users-uuid" }),
            });

            const req = buildGetRequest();
            const { status } = await readResponse(
                await new UsersUuidApiHandler(req, { uuid: "other-users-uuid" }).handle()
            );

            expect(status).toBe(StatusCode.OK);
        });

        it("Serviceが投げたResourceNotFoundErrorのステータスコードを引き継ぐ", async () => {
            UsersByUuidServiceImpl.getUsersByUuid.mockRejectedValue(new ResourceNotFoundError("User", TEST_UUID));

            const req = buildGetRequest();
            const { status, body } = await readResponse(
                await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle()
            );

            expect(status).toBe(StatusCode.NOT_FOUND);
            expect(body.errorCode).toBe("RESOURCE_NOT_FOUND");
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            UsersByUuidServiceImpl.getUsersByUuid.mockRejectedValue(new Error("DB down"));

            const req = buildGetRequest();
            const { status, body } = await readResponse(
                await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle()
            );

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB down");
        });
    });

    describe("PUT", () => {
        const validBody = { nickname: "新しいニックネーム" };

        it("Authorizationヘッダーが無い場合は401を返し、Serviceも呼ばれない", async () => {
            // 認証モックを外し、実際のresolveAuthUserを通す
            jest.restoreAllMocks();
            silenceApiLogs();

            const req = new NextRequest(new URL(BASE_URL), {
                method: "PUT",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(validBody),
            });
            const { status } = await readResponse(await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle());

            expect(status).toBe(StatusCode.UNAUTHORIZED);
            expect(UsersByUuidServiceImpl.putUsersByUuid).not.toHaveBeenCalled();
        });

        it("認証済みユーザーのuuidとパスパラメータのuuidが一致しない場合は403を返す", async () => {
            const req = buildPutRequest(validBody);
            const { status } = await readResponse(
                await new UsersUuidApiHandler(req, { uuid: "other-users-uuid" }).handle()
            );

            expect(status).toBe(StatusCode.FORBIDDEN);
            expect(UsersByUuidServiceImpl.putUsersByUuid).not.toHaveBeenCalled();
        });

        it("認証済みユーザーのuuidとパスパラメータのuuidが一致する場合はServiceを呼び出し、更新結果を返す", async () => {
            UsersByUuidServiceImpl.putUsersByUuid.mockResolvedValue({
                user: buildUserWithRelations({ uuid: TEST_UUID, nickname: validBody.nickname }),
            });

            const req = buildPutRequest(validBody);
            const { status, body } = await readResponse(
                await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle()
            );

            expect(UsersByUuidServiceImpl.putUsersByUuid).toHaveBeenCalledWith({
                uuid: TEST_UUID,
                ...validBody,
            });
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it("master adminは他ユーザーのuuidを指定しても更新できる", async () => {
            mockApiAuth({ user: buildUserWithRelations({ masterRole: Role.admin }) });
            UsersByUuidServiceImpl.putUsersByUuid.mockResolvedValue({
                user: buildUserWithRelations({ uuid: "other-users-uuid", nickname: validBody.nickname }),
            });

            const req = buildPutRequest(validBody);
            const { status } = await readResponse(
                await new UsersUuidApiHandler(req, { uuid: "other-users-uuid" }).handle()
            );

            expect(status).toBe(StatusCode.OK);
        });

        it("ボディが不正な場合（emailが不正な形式）は400を返し、Serviceを呼ばない", async () => {
            const req = buildPutRequest({ email: "not-an-email" });
            const { status } = await readResponse(await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(UsersByUuidServiceImpl.putUsersByUuid).not.toHaveBeenCalled();
        });

        it("Serviceが投げたConflictErrorのステータスコードを引き継ぐ", async () => {
            UsersByUuidServiceImpl.putUsersByUuid.mockRejectedValue(new ConflictError({ message: "conflict" }));

            const req = buildPutRequest(validBody);
            const { status } = await readResponse(await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle());

            expect(status).toBe(StatusCode.CONFLICT);
        });

        it("Serviceが投げたBadRequestErrorのステータスコードを引き継ぐ", async () => {
            UsersByUuidServiceImpl.putUsersByUuid.mockRejectedValue(new BadRequestError({ message: "invalid" }));

            const req = buildPutRequest(validBody);
            const { status } = await readResponse(await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            UsersByUuidServiceImpl.putUsersByUuid.mockRejectedValue(new Error("DB down"));

            const req = buildPutRequest(validBody);
            const { status, body } = await readResponse(
                await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle()
            );

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB down");
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["POST"], ["DELETE"], ["PATCH"]])("%sは405を返す", async (method) => {
            const req = new NextRequest(new URL(BASE_URL), {
                method,
                headers: { authorization: "Bearer test-access-token" },
            });
            const { status, body } = await readResponse(
                await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle()
            );

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
