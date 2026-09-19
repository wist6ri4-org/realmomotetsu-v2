/**
 * @jest-environment node
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { StatusCode } from "@/constants/statuscode";
import { BadRequestError, ResourceNotFoundError } from "@/error";
import { LogService } from "@/app/api/utils/logService";
import {
    buildRequestWithMethod,
    buildUnauthenticatedRequest,
    mockApiAuth,
    readResponse,
    silenceApiLogs,
} from "../../../helpers/apiRequest";
import { buildUserWithRelations } from "../../../helpers/factories";
import * as apiAuth from "@/app/api/utils/auth";
import { UnauthorizedError } from "@/error/apiError";

/** BaseApiHandlerの共通処理を検証するためのテスト用サブクラス */
class TestApiHandler extends BaseApiHandler {
    static getHandler: jest.Mock = jest.fn();

    protected getHandlers(): Handlers {
        return {
            GET: async (req: NextRequest) => TestApiHandler.getHandler(req),
        };
    }

    // protectedメソッドをテストから呼べるようにするためのpublicラッパー
    publicCreateSuccessResponse(data: unknown, status?: number): NextResponse {
        return this.createSuccessResponse(data, status);
    }

    publicCreateErrorResponse(message: string, status: number): NextResponse {
        return this.createErrorResponse(message, status);
    }

    publicHandleError(error: unknown): NextResponse {
        return this.handleError(error);
    }

    publicLogInfo(message: string, data?: unknown): void {
        this.logInfo(message, data);
    }
}

/** 認証を必須としないハンドラー（requireAuth のオーバーライドを検証する） */
class PublicApiHandler extends BaseApiHandler {
    static getHandler: jest.Mock = jest.fn();

    protected getHandlers(): Handlers {
        return {
            GET: async (req: NextRequest) => PublicApiHandler.getHandler(req),
        };
    }

    protected requireAuth(): boolean {
        return false;
    }
}

/** authUser の受け渡しを検証するためのハンドラー */
class AuthUserApiHandler extends BaseApiHandler {
    static seenUuid: string | null = null;

    protected getHandlers(): Handlers {
        return {
            GET: async () => {
                AuthUserApiHandler.seenUuid = this.getAuthUser().uuid;
                return NextResponse.json({ ok: true }, { status: StatusCode.OK });
            },
        };
    }
}

const buildReq = (method = "GET") => buildRequestWithMethod(method);

describe("BaseApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        mockApiAuth();
        TestApiHandler.getHandler = jest.fn();
        PublicApiHandler.getHandler = jest.fn();
        AuthUserApiHandler.seenUuid = null;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("handle", () => {
        it("対応するハンドラーの結果をそのまま返す", async () => {
            const successResponse = NextResponse.json({ ok: true }, { status: StatusCode.OK });
            TestApiHandler.getHandler.mockResolvedValue(successResponse);

            const handler = new TestApiHandler(buildReq());
            const response = await handler.handle();

            expect(TestApiHandler.getHandler).toHaveBeenCalled();
            expect(response.status).toBe(StatusCode.OK);
        });

        it("未対応のHTTPメソッドは405を返す", async () => {
            const handler = new TestApiHandler(buildReq("DELETE"));
            const { status, body } = await readResponse(await handler.handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe("Method DELETE not allowed");
            expect(TestApiHandler.getHandler).not.toHaveBeenCalled();
        });

        it("ハンドラーがApiErrorを投げた場合はそのステータスコードとエラーコードを返す", async () => {
            TestApiHandler.getHandler.mockRejectedValue(new ResourceNotFoundError("Team", "TEAM_A"));

            const handler = new TestApiHandler(buildReq());
            const { status, body } = await readResponse(await handler.handle());

            expect(status).toBe(StatusCode.NOT_FOUND);
            expect(body.errorCode).toBe("RESOURCE_NOT_FOUND");
        });

        it("ハンドラーがZodErrorを投げた場合は400を返す", async () => {
            const zodError = new ZodError([]);
            TestApiHandler.getHandler.mockRejectedValue(zodError);

            const handler = new TestApiHandler(buildReq());
            const { status, body } = await readResponse(await handler.handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Invalid request parameters");
        });

        it("ハンドラーが想定外のエラーを投げた場合は500を返し、内部メッセージを漏らさない", async () => {
            TestApiHandler.getHandler.mockRejectedValue(new Error("DB connection lost"));

            const handler = new TestApiHandler(buildReq());
            const { status, body } = await readResponse(await handler.handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(body.error).toBe("Internal Server Error");
            expect(JSON.stringify(body)).not.toContain("DB connection lost");
        });
    });

    describe("認証ゲート", () => {
        it("requireAuthが既定(true)のハンドラーは、トークンが無いと401を返しハンドラーを呼ばない", async () => {
            // 認証モックを外して実際のresolveAuthUserを通す
            jest.restoreAllMocks();
            silenceApiLogs();

            const handler = new TestApiHandler(buildUnauthenticatedRequest());
            const { status, body } = await readResponse(await handler.handle());

            expect(status).toBe(StatusCode.UNAUTHORIZED);
            expect(body.errorCode).toBe("AUTH_TOKEN_MISSING");
            expect(TestApiHandler.getHandler).not.toHaveBeenCalled();
        });

        it("resolveAuthUserがUnauthorizedErrorを投げた場合は401を返しハンドラーを呼ばない", async () => {
            jest.spyOn(apiAuth, "resolveAuthUser").mockRejectedValue(
                new UnauthorizedError({ message: "認証に失敗しました", errorCode: "AUTH_TOKEN_INVALID" })
            );

            const handler = new TestApiHandler(buildReq());
            const { status, body } = await readResponse(await handler.handle());

            expect(status).toBe(StatusCode.UNAUTHORIZED);
            expect(body.errorCode).toBe("AUTH_TOKEN_INVALID");
            expect(TestApiHandler.getHandler).not.toHaveBeenCalled();
        });

        it("requireAuthをfalseにしたハンドラーはトークン無しでも実行される", async () => {
            jest.restoreAllMocks();
            silenceApiLogs();
            PublicApiHandler.getHandler.mockResolvedValue(NextResponse.json({ ok: true }, { status: StatusCode.OK }));

            const handler = new PublicApiHandler(buildUnauthenticatedRequest());
            const response = await handler.handle();

            expect(response.status).toBe(StatusCode.OK);
            expect(PublicApiHandler.getHandler).toHaveBeenCalled();
        });

        it("認証済みユーザーをgetAuthUser()で参照できる", async () => {
            const user = buildUserWithRelations({ uuid: "11111111-1111-1111-1111-111111111111" });
            jest.spyOn(apiAuth, "resolveAuthUser").mockResolvedValue(user);

            const handler = new AuthUserApiHandler(buildReq());
            const response = await handler.handle();

            expect(response.status).toBe(StatusCode.OK);
            expect(AuthUserApiHandler.seenUuid).toBe("11111111-1111-1111-1111-111111111111");
        });

        it("未対応のHTTPメソッドは認証前に405を返す", async () => {
            jest.restoreAllMocks();
            silenceApiLogs();

            const handler = new TestApiHandler(buildUnauthenticatedRequest({ method: "DELETE" }));
            const { status } = await readResponse(await handler.handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
        });
    });

    describe("createSuccessResponse", () => {
        it("dataとrequestId/timestampを含むレスポンスを既定ステータス200で作成する", async () => {
            const handler = new TestApiHandler(buildReq());
            const { status, body } = await readResponse(handler.publicCreateSuccessResponse({ value: 1 }));

            expect(status).toBe(StatusCode.OK);
            expect(body.data).toEqual({ value: 1 });
            expect(body).toHaveProperty("requestId");
            expect(body).toHaveProperty("timestamp");
        });

        it("ステータスコードを指定した場合はそれを使用する", async () => {
            const handler = new TestApiHandler(buildReq());
            const { status } = await readResponse(
                handler.publicCreateSuccessResponse({ value: 1 }, StatusCode.CREATED),
            );

            expect(status).toBe(StatusCode.CREATED);
        });
    });

    describe("createErrorResponse", () => {
        it("指定したメッセージとステータスコードでエラーレスポンスを作成する", async () => {
            const handler = new TestApiHandler(buildReq());
            const { status, body } = await readResponse(
                handler.publicCreateErrorResponse("何かおかしい", StatusCode.BAD_REQUEST),
            );

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("何かおかしい");
        });
    });

    describe("handleError", () => {
        it("ApiErrorはエラーコード付きのレスポンスに変換される", async () => {
            const handler = new TestApiHandler(buildReq());
            const { status, body } = await readResponse(
                handler.publicHandleError(new BadRequestError({ message: "invalid" })),
            );

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("invalid");
            expect(body.errorCode).toBe("BAD_REQUEST");
        });

        it("ZodErrorはフィールドごとのバリデーションエラー一覧に変換される", async () => {
            const schema = z.object({ eventCode: z.string().min(1) });
            const result = schema.safeParse({});
            const handler = new TestApiHandler(buildReq());

            const { status, body } = await readResponse(handler.publicHandleError(result.error));

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
            expect(body.validationErrors).toEqual([
                expect.objectContaining({ field: "eventCode" }),
            ]);
        });

        it("想定外のエラーは500に変換され、内部メッセージを漏らさない", async () => {
            const handler = new TestApiHandler(buildReq());
            const { status, body } = await readResponse(handler.publicHandleError(new Error("secret detail")));

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(body.error).toBe("Internal Server Error");
            expect(JSON.stringify(body)).not.toContain("secret detail");
        });
    });

    describe("ログ出力", () => {
        it("logInfoはLogService.logInfoに委譲される", () => {
            // beforeEachのsilenceApiLogsで既にモック化されているLogService.logInfoの呼び出しを検証する
            const handler = new TestApiHandler(buildReq());
            handler.publicLogInfo("hello", { foo: "bar" });

            expect(LogService.logInfo).toHaveBeenCalledWith(expect.any(Object), "hello", { foo: "bar" });
        });
    });
});
