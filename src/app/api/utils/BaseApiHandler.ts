import { NextRequest, NextResponse } from "next/server";
import { LogService } from "./logService";
import { Handlers, LogContext } from "./types";
import { StatusCode } from "@/constants/statuscode";
import { ZodError } from "zod";

export abstract class BaseApiHandler {
    protected logContext: LogContext;

    /**
     * コンストラクタ
     * @param req - Next.jsのリクエストオブジェクト
     */
    constructor(protected req: NextRequest) {
        this.logContext = LogService.createLogContext(req);
    }

    /**
     * 子クラスで実装する必要があるハンドラーメソッド
     * @return {Handlers} - HTTPメソッドごとのハンドラーを定義したオブジェクト
     */
    protected abstract getHandlers(): Handlers;

    /**
     * メインの処理メソッド
     * @return {Promise<NextResponse>} - リクエストに対するレスポンス
     */
    async handle(): Promise<NextResponse> {
        // 処理開始時間を記録
        const startTime = Date.now();

        try {
            // リクエストのログを出力
            LogService.logInfo(this.logContext, "Request received");

            // HTTPメソッドに応じたハンドラーを取得
            const handlers = this.getHandlers();
            const method = this.req.method as keyof Handlers;
            const handler = handlers[method];

            // ハンドラーが存在しない場合は405 Method Not Allowedを返す
            if (!handler) {
                const response = this.createErrorResponse(
                    `Method ${method} not allowed`,
                    StatusCode.METHOD_NOT_ALLOWED
                );
                this.logResponse(StatusCode.METHOD_NOT_ALLOWED, startTime);
                return response;
            }

            const response = await handler(this.req);
            this.logResponse(response.status, startTime);
            return response;
        } catch (error) {
            if (error instanceof ZodError) {
                // ZodErrorの場合は400 Bad Requestを返す
                const response = this.createErrorResponse(
                    "Invalid request parameters",
                    StatusCode.BAD_REQUEST
                );
                this.logResponse(StatusCode.BAD_REQUEST, startTime);
                return response;
            }
            LogService.logError(this.logContext, error);
            const response = this.createErrorResponse(
                "Internal Server Error",
                StatusCode.INTERNAL_SERVER_ERROR
            );
            this.logResponse(StatusCode.INTERNAL_SERVER_ERROR, startTime);
            return response;
        }
    }

    /**
     * 共通のエラーレスポンスを作成するヘルパーメソッド
     * @param message - エラーメッセージ
     * @param status - HTTPステータスコード
     * @return {NextResponse} - エラーレスポンス
     */
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

    /**
     * 共通の成功レスポンスを作成するヘルパーメソッド
     * @param data - レスポンスデータ
     * @param status - HTTPステータスコード
     * @return {NextResponse} - 成功レスポンス
     */
    protected createSuccessResponse(data: unknown, status: number = StatusCode.OK): NextResponse {
        return NextResponse.json(
            {
                data,
                requestId: this.logContext.requestId,
                timestamp: this.logContext.timestamp,
            },
            { status }
        );
    }

    /**
     * Zodバリデーションエラーを適切なレスポンスに変換するヘルパーメソッド
     * @param error - ZodError オブジェクト
     * @return {NextResponse} - バリデーションエラーレスポンス
     */
    protected createValidationErrorResponse(error: ZodError): NextResponse {
        const validationErrors = error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
            code: issue.code,
        }));

        this.logInfo("Validation failed", { errors: validationErrors });

        return NextResponse.json(
            {
                error: "Validation failed",
                validationErrors,
                requestId: this.logContext.requestId,
                timestamp: this.logContext.timestamp,
            },
            { status: StatusCode.BAD_REQUEST }
        );
    }

    /**
     * エラーの種類に応じて適切なレスポンスを作成するヘルパーメソッド
     * @param error - エラーオブジェクト
     * @return {NextResponse} - エラーレスポンス
     */
    protected handleError(error: unknown): NextResponse {
        if (error instanceof ZodError) {
            return this.createValidationErrorResponse(error);
        }

        // その他のエラーは500として処理
        this.logError(error);
        return this.createErrorResponse("Internal Server Error", StatusCode.INTERNAL_SERVER_ERROR);
    }

    /**
     * ログ出力メソッド（INFO）
     * @param message - ログメッセージ
     * @param data - 追加データ（オプション）
     */
    protected logInfo(message: string, data?: unknown): void {
        LogService.logInfo(this.logContext, message, data);
    }

    /**
     * ログ出力メソッド（DEBUG）
     * @param message - ログメッセージ
     * @param data - 追加データ（オプション）
     */
    protected logDebug(message: string, data?: unknown): void {
        LogService.logDebug(this.logContext, message, data);
    }

    /**
     * ログ出力メソッド（ERROR）
     * @param message - ログメッセージ
     * @param data - 追加データ（オプション）
     */
    protected logError(error: Error | unknown): void {
        LogService.logError(this.logContext, error);
    }

    /**
     * レスポンスのステータスコードと処理時間をログに記録するヘルパーメソッド
     * @param statusCode - レスポンスのステータスコード
     * @param startTime - 処理開始時間（ミリ秒）
     */
    private logResponse(statusCode: number, startTime: number): void {
        const responseTime = Date.now() - startTime;
        LogService.logAccess(this.logContext, statusCode, responseTime);
    }
}
