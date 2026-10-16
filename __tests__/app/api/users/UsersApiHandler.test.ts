/**
 * @jest-environment node
 */

import { BadRequestError, ConflictError } from "@/error";
import { StatusCode } from "@/constants/statuscode";
import { buildUser } from "../../../helpers/factories";
import {
    buildPostRequest,
    buildRequestWithMethod,
    buildUnauthenticatedRequest,
    mockApiAuth,
    readResponse,
    silenceApiLogs,
} from "../../../helpers/apiRequest";

// UsersApiHandlerはUsersServiceImplを直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/users/service", () => ({
    UsersServiceImpl: {
        postUsers: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { UsersServiceImpl } = jest.requireMock("@/features/users/service") as {
    UsersServiceImpl: {
        postUsers: jest.Mock;
    };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import UsersApiHandler from "@/app/api/users/UsersApiHandler";

describe("UsersApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        mockApiAuth();
        UsersServiceImpl.postUsers.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("POST", () => {
        const validBody = {
            uuid: "00000000-0000-0000-0000-000000000001",
            email: "test@example.com",
            nickname: "テストユーザー",
        };

        it("リクエストボディをServiceに渡し、登録結果を返す", async () => {
            UsersServiceImpl.postUsers.mockResolvedValue({ user: buildUser(validBody) });

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(await new UsersApiHandler(req).handle());

            expect(UsersServiceImpl.postUsers).toHaveBeenCalledWith(validBody);
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it("nicknameを省略しても登録できる", async () => {
            const minimalBody = { uuid: validBody.uuid, email: validBody.email };
            UsersServiceImpl.postUsers.mockResolvedValue({ user: buildUser(minimalBody) });

            const req = buildPostRequest(minimalBody);
            const { status } = await readResponse(await new UsersApiHandler(req).handle());

            expect(UsersServiceImpl.postUsers).toHaveBeenCalledWith(minimalBody);
            expect(status).toBe(StatusCode.OK);
        });

        it.each([
            ["uuidがない", { email: "test@example.com" }],
            ["uuidが空文字", { ...validBody, uuid: "" }],
            ["emailがない", { uuid: validBody.uuid }],
            ["emailが不正な形式", { ...validBody, email: "not-an-email" }],
        ])("ボディが不正な場合（%s）は400を返し、Serviceを呼ばない", async (_label, body) => {
            const req = buildPostRequest(body);
            const { status } = await readResponse(await new UsersApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(UsersServiceImpl.postUsers).not.toHaveBeenCalled();
        });

        it("roleを送っても無視される（権限昇格の防止）", async () => {
            UsersServiceImpl.postUsers.mockResolvedValue({ user: buildUser(validBody) });

            const req = buildPostRequest({ ...validBody, role: "admin" });
            const { status } = await readResponse(await new UsersApiHandler(req).handle());

            expect(status).toBe(StatusCode.OK);
            // Zodがroleを除去するため、Serviceにはroleが渡らない
            expect(UsersServiceImpl.postUsers).toHaveBeenCalledWith(validBody);
            expect(UsersServiceImpl.postUsers.mock.calls[0][0]).not.toHaveProperty("role");
        });

        it("認証トークンが無くても登録できる（サインアップ直後に呼ばれるため）", async () => {
            // 認証ゲートを迂回していることを確かめるため、認証モックを外してトークン無しで呼ぶ
            jest.restoreAllMocks();
            silenceApiLogs();
            UsersServiceImpl.postUsers.mockResolvedValue({ user: buildUser(validBody) });

            const req = buildUnauthenticatedRequest({ method: "POST", body: validBody });
            const { status } = await readResponse(await new UsersApiHandler(req).handle());

            expect(status).toBe(StatusCode.OK);
            expect(UsersServiceImpl.postUsers).toHaveBeenCalledWith(validBody);
        });

        it("Serviceが投げたConflictErrorのステータスコードを引き継ぐ", async () => {
            UsersServiceImpl.postUsers.mockRejectedValue(new ConflictError({ message: "already exists" }));

            const req = buildPostRequest(validBody);
            const { status } = await readResponse(await new UsersApiHandler(req).handle());

            expect(status).toBe(StatusCode.CONFLICT);
        });

        it("Serviceが投げたBadRequestErrorのステータスコードを引き継ぐ", async () => {
            UsersServiceImpl.postUsers.mockRejectedValue(new BadRequestError({ message: "invalid" }));

            const req = buildPostRequest(validBody);
            const { status } = await readResponse(await new UsersApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            UsersServiceImpl.postUsers.mockRejectedValue(new Error("DB down"));

            const req = buildPostRequest(validBody);
            const { status, body } = await readResponse(await new UsersApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB down");
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["GET"], ["PUT"], ["DELETE"], ["PATCH"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(await new UsersApiHandler(req).handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
