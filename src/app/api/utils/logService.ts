import { AccessLog, ErrorLog, LogContext } from "./types";

export class LogService {
    /**
     * リクエストIDを生成する
     * @returns {string} - 生成されたリクエストID
     */
    private static generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * リクエストからログコンテキストを生成する
     * すべてのログで共通して使用される
     * @param req - リクエストオブジェクト
     * @return {LogContext} - 生成されたログコンテキスト
     */
    static createLogContext(req: Request): LogContext {
        return {
            method: req.method,
            url: req.url,
            userAgent: req.headers.get("user-agent") || undefined,
            timestamp: new Date().toISOString(),
            requestId: this.generateRequestId(),
        };
    }

    /**
     * アクセスログを記録する
     * @param context - ログコンテキスト
     * @param statusCode - レスポンスステータスコード
     * @param responseTime - レスポンス時間（ミリ秒）
     */
    static logAccess(context: LogContext, statusCode: number, responseTime: number): void {
        const accessLog: AccessLog = {
            ...context,
            statusCode,
            responseTime,
        };

        const now = new Date().toISOString();
        console.log(
            `[ACCESS] ${now} ${accessLog.requestId} ${accessLog.method} ${accessLog.url} - ${statusCode} (${responseTime}ms)`
        );

        // 本番環境では外部ログサービスに送信
        if (process.env.NODE_ENV === "production") {
            // TODO: 外部ログサービス（例：CloudWatch, Datadog等）に送信
        }
    }

    /**
     * エラーログを記録する
     * @param context - ログコンテキスト
     * @param error - エラーオブジェクト
     */
    static logError(context: LogContext, error: Error | unknown): void {
        const errorLog: ErrorLog = {
            ...context,
            error,
            stackTrace: error instanceof Error ? error.stack : undefined,
        };

        const now = new Date().toISOString();
        console.error(`[ERROR] ${now} ${errorLog.requestId} ${errorLog.method} ${errorLog.url}:`, {
            error: error instanceof Error ? error.message : String(error),
            stack: errorLog.stackTrace,
        });

        // 本番環境では外部エラー追跡サービスに送信
        if (process.env.NODE_ENV === "production") {
            // TODO: 外部エラー追跡サービス（例：Sentry, Bugsnag等）に送信
        }
    }

    /**
     * 情報ログを記録する
     * @param context - ログコンテキスト
     * @param message - ログメッセージ
     * @param data - 追加データ（オプション）
     */
    static logInfo(context: LogContext, message: string, data?: unknown): void {
        const now = new Date().toISOString();
        console.log(`[INFO] ${now} ${context.requestId} ${context.method} ${context.url}: ${message}`, data);
    }

    /**
     * デバッグログを記録する
     * @param context - ログコンテキスト
     * @param message - ログメッセージ
     * @param data - 追加データ（オプション）
     */
    static logDebug(context: LogContext, message: string, data?: unknown): void {
        const now = new Date().toISOString();
        if (process.env.NODE_ENV === "development") {
            console.debug(`[DEBUG] ${now} ${context.requestId} ${context.method} ${context.url}: ${message}`, data);
        }
    }
}
