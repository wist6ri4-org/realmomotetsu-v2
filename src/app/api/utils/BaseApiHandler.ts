import { NextRequest, NextResponse } from "next/server";
import { LogService } from "./logService";
import { Handlers, LogContext } from "./types";
import { resolveAuthUser } from "./auth";
import { StatusCode } from "@/constants/statuscode";
import { ZodError } from "zod";
import { ApiError, UnauthorizedError } from "@/error/apiError";
import { UsersWithRelations } from "@/repositories/users/UsersRepository";

export abstract class BaseApiHandler {
    protected logContext: LogContext;

    /**
     * 認証済みユーザー。
     * `requireAuth()` が true の場合、`handle()` がハンドラー実行前に解決する。
     */
    protected authUser: UsersWithRelations | null = null;

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
     * 認証を必須とするかどうか。
     *
     * デフォルトは true（安全側）。認証前に呼ぶ必要があるエンドポイント
     * （サインアップ直後の POST /api/users など）だけが false に上書きする。
     *
     * @return {boolean} - 認証を必須とする場合はtrue
     */
    protected requireAuth(): boolean {
        return true;
    }

    /**
     * 認証済みユーザーを取得する。
     * `requireAuth()` が true のハンドラー内から呼ぶこと。
     *
     * @return {UsersWithRelations} - 認証済みユーザー
     * @throws {UnauthorizedError} - 認証されていない場合
     */
    protected getAuthUser(): UsersWithRelations {
        if (!this.authUser) {
            throw new UnauthorizedError({
                message: "認証が必要です",
                errorCode: "AUTH_TOKEN_MISSING",
            });
        }
        return this.authUser;
    }

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

            // 認証はここに集約している。createApiHandler / createApiHandlerWithParams 経由で
            // 全エンドポイントがこの handle() を通るため、1箇所で全ルートに効く。
            if (this.requireAuth()) {
                this.authUser = await resolveAuthUser(this.req);
            }

            const response = await handler(this.req);
            this.logResponse(response.status, startTime);
            return response;
        } catch (error) {
            if (error instanceof ApiError) {
                // APIErrorの場合は適切なステータスコードとメッセージを返す
                this.logError(error);
                const response = this.createApiErrorResponse(error);
                this.logResponse(error.statusCode, startTime);
                return response;
            }
            if (error instanceof ZodError) {
                // ZodErrorの場合は400 Bad Requestを返す
                const response = this.createErrorResponse("Invalid request parameters", StatusCode.BAD_REQUEST);
                this.logResponse(StatusCode.BAD_REQUEST, startTime);
                return response;
            }
            LogService.logError(this.logContext, error);
            const response = this.createErrorResponse("Internal Server Error", StatusCode.INTERNAL_SERVER_ERROR);
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
     * APIErrorレスポンスを作成するヘルパーメソッド
     * @param error - APIErrorオブジェクト
     * @return {NextResponse} - エラーレスポンス
     */
    protected createApiErrorResponse(error: ApiError): NextResponse {
        return NextResponse.json(
            {
                error: error.message,
                errorCode: error.errorCode,
                details: error.details,
                requestId: this.logContext.requestId,
                timestamp: this.logContext.timestamp,
            },
            { status: error.statusCode }
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
        if (error instanceof ApiError) {
            // APIErrorの場合は適切なステータスコードとメッセージを返す
            this.logError(error);
            return this.createApiErrorResponse(error);
        }

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
