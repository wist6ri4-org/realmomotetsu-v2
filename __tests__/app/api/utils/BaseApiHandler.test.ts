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
import { silenceApiLogs, readResponse, buildRequestWithMethod } from "../../../helpers/apiRequest";

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

const buildReq = (method = "GET") => buildRequestWithMethod(method);

describe("BaseApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        TestApiHandler.getHandler = jest.fn();
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
