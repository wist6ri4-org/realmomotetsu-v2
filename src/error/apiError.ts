/**
 * APIで使用する基本エラークラス
 * serviceでcatchしたときにAPIErrorをthrowして、BaseAPIHandlerでcatchしてログに出力する
 */
export abstract class ApiError extends Error {
    /**
     * HTTPステータスコード
     */
    public readonly statusCode: number;

    /**
     * エラーコード（アプリケーション固有）
     */
    public readonly errorCode: string;

    /**
     * 追加のエラー情報
     */
    public readonly details?: unknown;

    constructor(message: string, statusCode: number, errorCode: string, details?: unknown) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.details = details;

        // スタックトレースを正しく設定
        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * エラーの詳細情報をオブジェクトとして返す
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            statusCode: this.statusCode,
            errorCode: this.errorCode,
            details: this.details,
        };
    }
}

/**
 * 400 Bad Request エラー
 */
export class BadRequestError extends ApiError {
    constructor(message?: string, errorCode?: string, details?: unknown);
    constructor(options: { message?: string; errorCode?: string; details?: unknown });
    constructor(
        messageOrOptions: string | { message?: string; errorCode?: string; details?: unknown } = "Bad Request",
        errorCode: string = "BAD_REQUEST",
        details?: unknown
    ) {
        if (typeof messageOrOptions === "object") {
            const { message = "Bad Request", errorCode: code = "BAD_REQUEST", details: det } = messageOrOptions;
            super(message, 400, code, det);
        } else {
            super(messageOrOptions, 400, errorCode, details);
        }
    }
}

/**
 * 401 Unauthorized エラー
 */
export class UnauthorizedError extends ApiError {
    constructor(message?: string, errorCode?: string, details?: unknown);
    constructor(options: { message?: string; errorCode?: string; details?: unknown });
    constructor(
        messageOrOptions: string | { message?: string; errorCode?: string; details?: unknown } = "Unauthorized",
        errorCode: string = "UNAUTHORIZED",
        details?: unknown
    ) {
        if (typeof messageOrOptions === "object") {
            const { message = "Unauthorized", errorCode: code = "UNAUTHORIZED", details: det } = messageOrOptions;
            super(message, 401, code, det);
        } else {
            super(messageOrOptions, 401, errorCode, details);
        }
    }
}

/**
 * 403 Forbidden エラー
 */
export class ForbiddenError extends ApiError {
    constructor(message?: string, errorCode?: string, details?: unknown);
    constructor(options: { message?: string; errorCode?: string; details?: unknown });
    constructor(
        messageOrOptions: string | { message?: string; errorCode?: string; details?: unknown } = "Forbidden",
        errorCode: string = "FORBIDDEN",
        details?: unknown
    ) {
        if (typeof messageOrOptions === "object") {
            const { message = "Forbidden", errorCode: code = "FORBIDDEN", details: det } = messageOrOptions;
            super(message, 403, code, det);
        } else {
            super(messageOrOptions, 403, errorCode, details);
        }
    }
}

/**
 * 404 Not Found エラー
 */
export class NotFoundError extends ApiError {
    constructor(message?: string, errorCode?: string, details?: unknown);
    constructor(options: { message?: string; errorCode?: string; details?: unknown });
    constructor(
        messageOrOptions: string | { message?: string; errorCode?: string; details?: unknown } = "Not Found",
        errorCode: string = "NOT_FOUND",
        details?: unknown
    ) {
        if (typeof messageOrOptions === "object") {
            const { message = "Not Found", errorCode: code = "NOT_FOUND", details: det } = messageOrOptions;
            super(message, 404, code, det);
        } else {
            super(messageOrOptions, 404, errorCode, details);
        }
    }
}

/**
 * 409 Conflict エラー
 */
export class ConflictError extends ApiError {
    constructor(message?: string, errorCode?: string, details?: unknown);
    constructor(options: { message?: string; errorCode?: string; details?: unknown });
    constructor(
        messageOrOptions: string | { message?: string; errorCode?: string; details?: unknown } = "Conflict",
        errorCode: string = "CONFLICT",
        details?: unknown
    ) {
        if (typeof messageOrOptions === "object") {
            const { message = "Conflict", errorCode: code = "CONFLICT", details: det } = messageOrOptions;
            super(message, 409, code, det);
        } else {
            super(messageOrOptions, 409, errorCode, details);
        }
    }
}

/**
 * 422 Unprocessable Entity エラー
 */
export class UnprocessableEntityError extends ApiError {
    constructor(message?: string, errorCode?: string, details?: unknown);
    constructor(options: { message?: string; errorCode?: string; details?: unknown });
    constructor(
        messageOrOptions: string | { message?: string; errorCode?: string; details?: unknown } = "Unprocessable Entity",
        errorCode: string = "UNPROCESSABLE_ENTITY",
        details?: unknown
    ) {
        if (typeof messageOrOptions === "object") {
            const {
                message = "Unprocessable Entity",
                errorCode: code = "UNPROCESSABLE_ENTITY",
                details: det,
            } = messageOrOptions;
            super(message, 422, code, det);
        } else {
            super(messageOrOptions, 422, errorCode, details);
        }
    }
}

/**
 * 500 Internal Server Error エラー
 */
export class InternalServerError extends ApiError {
    constructor(message?: string, errorCode?: string, details?: unknown);
    constructor(options: { message?: string; errorCode?: string; details?: unknown });
    constructor(
        messageOrOptions:
            | string
            | { message?: string; errorCode?: string; details?: unknown } = "Internal Server Error",
        errorCode: string = "INTERNAL_SERVER_ERROR",
        details?: unknown
    ) {
        if (typeof messageOrOptions === "object") {
            const {
                message = "Internal Server Error",
                errorCode: code = "INTERNAL_SERVER_ERROR",
                details: det,
            } = messageOrOptions;
            super(message, 500, code, det);
        } else {
            super(messageOrOptions, 500, errorCode, details);
        }
    }
}

/**
 * 503 Service Unavailable エラー
 */
export class ServiceUnavailableError extends ApiError {
    constructor(message?: string, errorCode?: string, details?: unknown);
    constructor(options: { message?: string; errorCode?: string; details?: unknown });
    constructor(
        messageOrOptions: string | { message?: string; errorCode?: string; details?: unknown } = "Service Unavailable",
        errorCode: string = "SERVICE_UNAVAILABLE",
        details?: unknown
    ) {
        if (typeof messageOrOptions === "object") {
            const {
                message = "Service Unavailable",
                errorCode: code = "SERVICE_UNAVAILABLE",
                details: det,
            } = messageOrOptions;
            super(message, 503, code, det);
        } else {
            super(messageOrOptions, 503, errorCode, details);
        }
    }
}

// ビジネスエラー用の基底クラス

/**
 * ビジネスロジックエラーの基底クラス
 */
export abstract class BusinessError extends ApiError {
    constructor(message: string, statusCode: number, errorCode: string, details?: unknown) {
        super(message, statusCode, errorCode, details);
    }
}

/**
 * リソースが見つからないビジネスエラー
 */
export class ResourceNotFoundError extends BusinessError {
    constructor(resourceType: string, identifier?: string | number, details?: unknown) {
        const message = identifier
            ? `${resourceType} with identifier '${identifier}' not found`
            : `${resourceType} not found`;
        super(message, 404, "RESOURCE_NOT_FOUND", details);
    }
}

/**
 * 重複リソースエラー
 */
export class DuplicateResourceError extends BusinessError {
    constructor(resourceType: string, identifier?: string | number, details?: unknown) {
        const message = identifier
            ? `${resourceType} with identifier '${identifier}' already exists`
            : `${resourceType} already exists`;
        super(message, 409, "DUPLICATE_RESOURCE", details);
    }
}

/**
 * 無効な操作エラー
 */
export class InvalidOperationError extends BusinessError {
    constructor(operation: string, reason?: string, details?: unknown) {
        const message = reason ? `Invalid operation '${operation}': ${reason}` : `Invalid operation '${operation}'`;
        super(message, 422, "INVALID_OPERATION", details);
    }
}

/**
 * ビジネスルール違反エラー
 */
export class BusinessRuleViolationError extends BusinessError {
    constructor(rule: string, details?: unknown) {
        super(`Business rule violation: ${rule}`, 422, "BUSINESS_RULE_VIOLATION", details);
    }
}

/**
 * データ整合性エラー
 */
export class DataIntegrityError extends BusinessError {
    constructor(message: string, details?: unknown) {
        super(`Data integrity error: ${message}`, 422, "DATA_INTEGRITY_ERROR", details);
    }
}

/**
 * 外部サービスエラー
 */
export class ExternalServiceError extends BusinessError {
    constructor(serviceName: string, originalError?: Error, details?: unknown) {
        const message = `External service '${serviceName}' error: ${originalError?.message || "Unknown error"}`;
        super(message, 503, "EXTERNAL_SERVICE_ERROR", details);
    }
}

/**
 * 認証エラー
 */
export class AuthenticationError extends BusinessError {
    constructor(message: string = "Authentication failed", details?: unknown) {
        super(message, 401, "AUTHENTICATION_ERROR", details);
    }
}

/**
 * 認可エラー
 */
export class AuthorizationError extends BusinessError {
    constructor(message: string = "Authorization failed", details?: unknown) {
        super(message, 403, "AUTHORIZATION_ERROR", details);
    }
}
