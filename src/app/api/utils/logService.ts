import { AccessLog, ErrorLog, LogContext } from "./types";

export class LogService {
    private static generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    static createLogContext(req: Request): LogContext {
        return {
            method: req.method,
            url: req.url,
            userAgent: req.headers.get("user-agent") || undefined,
            timestamp: new Date().toISOString(),
            requestId: this.generateRequestId(),
        };
    }

    static logAccess(context: LogContext, statusCode: number, responseTime: number): void {
        const accessLog: AccessLog = {
            ...context,
            statusCode,
            responseTime,
        };

        console.log(
            `[ACCESS] ${accessLog.requestId} ${accessLog.method} ${accessLog.url} - ${statusCode} (${responseTime}ms)`
        );

        // 本番環境では外部ログサービスに送信
        if (process.env.NODE_ENV === "production") {
            // TODO: 外部ログサービス（例：CloudWatch, Datadog等）に送信
        }
    }

    static logError(context: LogContext, error: Error | unknown): void {
        const errorLog: ErrorLog = {
            ...context,
            error,
            stackTrace: error instanceof Error ? error.stack : undefined,
        };

        console.error(`[ERROR] ${errorLog.requestId} ${errorLog.method} ${errorLog.url}:`, {
            error: error instanceof Error ? error.message : String(error),
            stack: errorLog.stackTrace,
        });

        // 本番環境では外部エラー追跡サービスに送信
        if (process.env.NODE_ENV === "production") {
            // TODO: 外部エラー追跡サービス（例：Sentry, Bugsnag等）に送信
        }
    }

    static logInfo(context: LogContext, message: string, data?: unknown): void {
        console.log(
            `[INFO] ${context.requestId} ${context.method} ${context.url}: ${message}`,
            data
        );
    }

    static logDebug(context: LogContext, message: string, data?: unknown): void {
        if (process.env.NODE_ENV === "development") {
            console.debug(
                `[DEBUG] ${context.requestId} ${context.method} ${context.url}: ${message}`,
                data
            );
        }
    }
}
