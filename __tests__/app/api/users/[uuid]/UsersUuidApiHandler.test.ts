/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { BadRequestError, ConflictError, ResourceNotFoundError } from "@/error";
import { StatusCode } from "@/constants/statuscode";
import { buildUser } from "../../../../helpers/factories";
import { buildGetRequest, readResponse, silenceApiLogs } from "../../../../helpers/apiRequest";

/** テスト対象のUUID（認証したユーザーのuuidと一致させる） */
const TEST_UUID = "00000000-0000-0000-0000-000000000001";

/** テスト用のベースURL */
const BASE_URL = "http://localhost:3001/api/test";

/**
 * JSONボディを持つPUTリクエストを生成する
 * @param {unknown} body - リクエストボディ
 * @param {Record<string, string>} headers - 追加のヘッダー
 * @return {NextRequest} リクエスト
 */
const buildPutRequest = (body: unknown, headers: Record<string, string> = {}): NextRequest =>
    new NextRequest(new URL(BASE_URL), {
        method: "PUT",
        headers: { "content-type": "application/json", ...headers },
        body: typeof body === "string" ? body : JSON.stringify(body),
    });

/**
 * 属性情報（attendances）を含むユーザーを生成する
 * @param {Parameters<typeof buildUser>[0]} overrides - 上書きする項目
 * @return {ReturnType<typeof buildUser> & { attendances: unknown[] }} リレーション付きのユーザー
 */
const buildUserWithRelations = (overrides: Parameters<typeof buildUser>[0] = {}) => ({
    ...buildUser(overrides),
    attendances: [],
});

// UsersUuidApiHandlerはUsersByUuidServiceImplを直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/users/[uuid]/service", () => ({
    UsersByUuidServiceImpl: {
        getUsersByUuid: jest.fn(),
        putUsersByUuid: jest.fn(),
    },
}));

// PUTハンドラーの認証チェックで使われるsupabaseクライアントをモックする
jest.mock("@/lib/supabase", () => ({
    __esModule: true,
    default: {
        auth: {
            getUser: jest.fn(),
        },
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { UsersByUuidServiceImpl } = jest.requireMock("@/features/users/[uuid]/service") as {
    UsersByUuidServiceImpl: {
        getUsersByUuid: jest.Mock;
        putUsersByUuid: jest.Mock;
    };
};

// eslint-disable-next-line @typescript-eslint/no-require-imports
const supabaseMock = jest.requireMock("@/lib/supabase").default as {
    auth: { getUser: jest.Mock };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import UsersUuidApiHandler from "@/app/api/users/[uuid]/UsersUuidApiHandler";

describe("UsersUuidApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        UsersByUuidServiceImpl.getUsersByUuid.mockReset();
        UsersByUuidServiceImpl.putUsersByUuid.mockReset();
        supabaseMock.auth.getUser.mockReset();
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
                await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle(),
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

        it("Serviceが投げたResourceNotFoundErrorのステータスコードを引き継ぐ", async () => {
            UsersByUuidServiceImpl.getUsersByUuid.mockRejectedValue(new ResourceNotFoundError("User", TEST_UUID));

            const req = buildGetRequest();
            const { status, body } = await readResponse(
                await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle(),
            );

            expect(status).toBe(StatusCode.NOT_FOUND);
            expect(body.errorCode).toBe("RESOURCE_NOT_FOUND");
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            UsersByUuidServiceImpl.getUsersByUuid.mockRejectedValue(new Error("DB down"));

            const req = buildGetRequest();
            const { status, body } = await readResponse(
                await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle(),
            );

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB down");
        });
    });

    describe("PUT", () => {
        const validBody = { nickname: "新しいニックネーム" };

        it("Authorizationヘッダーが無い場合は401を返し、認証もServiceも呼ばれない", async () => {
            const req = buildPutRequest(validBody);
            const { status, body } = await readResponse(
                await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle(),
            );

            expect(status).toBe(StatusCode.UNAUTHORIZED);
            expect(supabaseMock.auth.getUser).not.toHaveBeenCalled();
            expect(UsersByUuidServiceImpl.putUsersByUuid).not.toHaveBeenCalled();
        });

        it("supabaseの認証がエラーを返す場合は401を返す", async () => {
            supabaseMock.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: { message: "invalid token" },
            });

            const req = buildPutRequest(validBody, { authorization: "Bearer invalid-token" });
            const { status } = await readResponse(await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle());

            expect(status).toBe(StatusCode.UNAUTHORIZED);
            expect(UsersByUuidServiceImpl.putUsersByUuid).not.toHaveBeenCalled();
        });

        it("supabaseの認証がuserを返さない場合は401を返す", async () => {
            supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

            const req = buildPutRequest(validBody, { authorization: "Bearer some-token" });
            const { status } = await readResponse(await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle());

            expect(status).toBe(StatusCode.UNAUTHORIZED);
            expect(UsersByUuidServiceImpl.putUsersByUuid).not.toHaveBeenCalled();
        });

        it("認証済みユーザーのidとパスパラメータのuuidが一致しない場合は403を返す", async () => {
            supabaseMock.auth.getUser.mockResolvedValue({
                data: { user: { id: "other-user-uuid" } },
                error: null,
            });

            const req = buildPutRequest(validBody, { authorization: "Bearer valid-token" });
            const { status } = await readResponse(await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle());

            expect(status).toBe(StatusCode.FORBIDDEN);
            expect(UsersByUuidServiceImpl.putUsersByUuid).not.toHaveBeenCalled();
        });

        it("認証済みユーザーのidとuuidが一致する場合はServiceを呼び出し、更新結果を返す", async () => {
            supabaseMock.auth.getUser.mockResolvedValue({
                data: { user: { id: TEST_UUID } },
                error: null,
            });
            UsersByUuidServiceImpl.putUsersByUuid.mockResolvedValue({
                user: buildUserWithRelations({ uuid: TEST_UUID, nickname: validBody.nickname }),
            });

            const req = buildPutRequest(validBody, { authorization: "Bearer valid-token" });
            const { status, body } = await readResponse(
                await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle(),
            );

            expect(UsersByUuidServiceImpl.putUsersByUuid).toHaveBeenCalledWith({
                uuid: TEST_UUID,
                ...validBody,
            });
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it("認証成功後、ボディが不正な場合（emailが不正な形式）は400を返し、Serviceを呼ばない", async () => {
            supabaseMock.auth.getUser.mockResolvedValue({
                data: { user: { id: TEST_UUID } },
                error: null,
            });

            const req = buildPutRequest({ email: "not-an-email" }, { authorization: "Bearer valid-token" });
            const { status } = await readResponse(await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(UsersByUuidServiceImpl.putUsersByUuid).not.toHaveBeenCalled();
        });

        it("Serviceが投げたConflictErrorのステータスコードを引き継ぐ", async () => {
            supabaseMock.auth.getUser.mockResolvedValue({
                data: { user: { id: TEST_UUID } },
                error: null,
            });
            UsersByUuidServiceImpl.putUsersByUuid.mockRejectedValue(new ConflictError({ message: "conflict" }));

            const req = buildPutRequest(validBody, { authorization: "Bearer valid-token" });
            const { status } = await readResponse(await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle());

            expect(status).toBe(StatusCode.CONFLICT);
        });

        it("Serviceが投げたBadRequestErrorのステータスコードを引き継ぐ", async () => {
            supabaseMock.auth.getUser.mockResolvedValue({
                data: { user: { id: TEST_UUID } },
                error: null,
            });
            UsersByUuidServiceImpl.putUsersByUuid.mockRejectedValue(new BadRequestError({ message: "invalid" }));

            const req = buildPutRequest(validBody, { authorization: "Bearer valid-token" });
            const { status } = await readResponse(await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            supabaseMock.auth.getUser.mockResolvedValue({
                data: { user: { id: TEST_UUID } },
                error: null,
            });
            UsersByUuidServiceImpl.putUsersByUuid.mockRejectedValue(new Error("DB down"));

            const req = buildPutRequest(validBody, { authorization: "Bearer valid-token" });
            const { status, body } = await readResponse(
                await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle(),
            );

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB down");
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["POST"], ["DELETE"], ["PATCH"]])("%sは405を返す", async (method) => {
            const req = new NextRequest(new URL(BASE_URL), { method });
            const { status, body } = await readResponse(
                await new UsersUuidApiHandler(req, { uuid: TEST_UUID }).handle(),
            );

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
