import { ErrorCodes } from "@/constants/errorCodes";
import { getMessage } from "@/constants/messages";

/**
 * アプリケーションエラークラス
 * アプリケーション固有のエラーを表現し、エラーコードとメッセージを管理する
 */
export class ApplicationError extends Error {
    public readonly code: string;
    public readonly originalError?: Error;

    /**
     * ApplicationErrorコンストラクタ
     * @param code エラーコード
     * @param message エラーメッセージ
     * @param originalError 元のエラー（オプション）
     */
    constructor(code: string, message: string, originalError?: Error) {
        super(message);
        this.name = "ApplicationError";
        this.code = code;
        this.originalError = originalError;

        // スタックトレースを適切に設定
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, ApplicationError);
        }
    }

    /**
     * エラーの詳細情報を取得
     * @returns エラーの詳細情報
     */
    getDetails(): {
        code: string;
        message: string;
        originalError?: string;
    } {
        return {
            code: this.code,
            message: this.message,
            originalError: this.originalError?.message,
        };
    }
}

/**
 * ApplicationErrorファクトリークラス
 * エラーコードに基づいてApplicationErrorインスタンスを生成する
 */
export class ApplicationErrorFactory {
    /**
     * エラーコードに基づいてApplicationErrorを作成
     * @param code エラーコード
     * @param message エラーメッセージ
     * @param originalError 元のエラー（オプション）
     * @returns ApplicationErrorインスタンス
     */
    static create(code: string, message: string, originalError?: Error): ApplicationError {
        return new ApplicationError(code, message, originalError);
    }

    /**
     * レスポンスステータスに基づいてエラーを作成
     * @param response HTTPレスポンス
     * @returns ApplicationError
     */
    static createFromResponse(response: Response): ApplicationError {
        if (response.status >= 500) {
            return this.create(ErrorCodes.SERVER_ERROR, getMessage("SERVER_ERROR"));
        } else if (response.status >= 400) {
            return this.create(
                ErrorCodes.API_REQUEST_FAILED,
                getMessage("API_REQUEST_FAILED", { status: response.status.toString() })
            );
        }

        return this.create(ErrorCodes.UNKNOWN_ERROR, getMessage("UNEXPECTED_ERROR"));
    }

    /**
     * ネットワークエラーの作成
     * @param originalError 元のエラー
     * @returns ApplicationError
     */
    static createNetworkError(originalError?: Error): ApplicationError {
        return this.create(ErrorCodes.NETWORK_ERROR, getMessage("NETWORK_ERROR"), originalError);
    }

    /**
     * エラークラスをApplicationErrorに統一
     * @param error 元のエラー
     * @returns ApplicationErrorインスタンス
     */
    static normalize(error: unknown): ApplicationError {
        if (error instanceof ApplicationError) {
            return error;
        }

        if (error instanceof Error) {
            return this.create(ErrorCodes.UNKNOWN_ERROR, error.message, error);
        }

        return new ApplicationError(
            "UNKNOWN_ERROR",
            typeof error === "string" ? error : "予期しないエラーが発生しました。"
        );
    }
}
