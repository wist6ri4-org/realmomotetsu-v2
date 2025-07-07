import { NextRequest, NextResponse } from "next/server";
import { LogService } from "./logService";
import { Handlers, LogContext } from "./types";

export abstract class BaseApiHandler {
    protected logContext: LogContext;

    constructor(protected req: NextRequest) {
        this.logContext = LogService.createLogContext(req);
    }

    // 子クラスで実装する必要があるハンドラーメソッド
    protected abstract getHandlers(): Handlers;

    // メインの処理メソッド
    async handle(): Promise<NextResponse> {
        const startTime = Date.now();

        try {
            LogService.logInfo(this.logContext, "Request received");

            const handlers = this.getHandlers();
            const method = this.req.method as keyof Handlers;
            const handler = handlers[method];

            if (!handler) {
                const response = this.createErrorResponse(`Method ${method} not allowed`, 405);
                this.logResponse(405, startTime);
                return response;
            }

            const response = await handler(this.req);
            this.logResponse(response.status, startTime);
            return response;
        } catch (error) {
            LogService.logError(this.logContext, error);
            const response = this.createErrorResponse("Internal Server Error", 500);
            this.logResponse(500, startTime);
            return response;
        }
    }

    // 共通のエラーレスポンス作成
    protected createErrorResponse(message: string, status: number): NextResponse {
        return NextResponse.json(
            {
                error: message,
                requestId: this.logContext.requestId,
                timestamp: this.logContext.timestamp,
            },
            { status }
        );
    }

    // 共通の成功レスポンス作成
    protected createSuccessResponse(data: unknown, status: number = 200): NextResponse {
        return NextResponse.json(
            {
                data,
                requestId: this.logContext.requestId,
                timestamp: this.logContext.timestamp,
            },
            { status }
        );
    }

    // ログ出力のヘルパー
    protected logInfo(message: string, data?: unknown): void {
        LogService.logInfo(this.logContext, message, data);
    }

    protected logDebug(message: string, data?: unknown): void {
        LogService.logDebug(this.logContext, message, data);
    }

    protected logError(error: Error | unknown): void {
        LogService.logError(this.logContext, error);
    }

    // レスポンスログ
    private logResponse(statusCode: number, startTime: number): void {
        const responseTime = Date.now() - startTime;
        LogService.logAccess(this.logContext, statusCode, responseTime);
    }
}
