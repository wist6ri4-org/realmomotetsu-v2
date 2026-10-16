import { ErrorCodes } from "@/constants/errorCodes";
import { getMessage } from "@/constants/messages";
import { ApplicationError, ApplicationErrorFactory } from "@/error/applicationError";

/**
 * バリデーションエラーハンドリング用ユーティリティ
 */
export class ValidationErrorHandler {
    /**
     * 必須フィールドのチェック
     * @param value チェックする値
     * @param fieldName フィールド名
     */
    static validateRequired(value: string | number | null | undefined, fieldName: string): void {
        if (value === null || value === undefined || value === "") {
            throw ApplicationErrorFactory.create(
                ErrorCodes.REQUIRED_FIELD_ERROR,
                getMessage("FIELD_IS_REQUIRED", { field: fieldName })
            );
        }
    }

    /**
     * 正の値チェック
     * @param value チェックする値
     * @param fieldName フィールド名
     */
    static validatePositive(value: number, fieldName: string): void {
        if (value <= 0) {
            throw ApplicationErrorFactory.create(
                ErrorCodes.VALUE_OUT_OF_RANGE_ERROR,
                getMessage("VALUE_MUST_BE_POSITIVE", { field: fieldName })
            );
        }
    }

    /**
     * 最小値チェック
     * @param value チェックする値
     * @param min 最小値
     * @param fieldName フィールド名
     */
    static validateMinValue(value: number, min: number, fieldName: string): void {
        if (value < min) {
            throw ApplicationErrorFactory.create(
                ErrorCodes.VALUE_OUT_OF_RANGE_ERROR,
                getMessage("VALUE_MUST_BE_AT_LEAST", { field: fieldName, min: min.toString() })
            );
        }
    }

    /**
     * 最大値チェック
     * @param value チェックする値
     * @param max 最大値
     * @param fieldName フィールド名
     */
    static validateMaxValue(value: number, max: number, fieldName: string): void {
        if (value > max) {
            throw ApplicationErrorFactory.create(
                ErrorCodes.VALUE_OUT_OF_RANGE_ERROR,
                getMessage("VALUE_MUST_BE_AT_MOST", { field: fieldName, max: max.toString() })
            );
        }
    }

    /**
     * 範囲チェック
     * @param value チェックする値
     * @param min 最小値
     * @param max 最大値
     * @param fieldName フィールド名
     */
    static validateRange(value: number, min: number, max: number, fieldName: string): void {
        if (value < min || value > max) {
            throw ApplicationErrorFactory.create(
                ErrorCodes.VALUE_OUT_OF_RANGE_ERROR,
                getMessage("VALUE_MUST_BE_BETWEEN", { field: fieldName, min: min.toString(), max: max.toString() })
            );
        }
    }
}

/**
 * APIエラーハンドリング用ユーティリティ
 */
export class ApplicationErrorHandler {
    /**
     * エラーログの出力
     * @param error ApplicationError
     * @param context エラーが発生したコンテキスト
     */
    static logError(error: ApplicationError, context?: string): void {
        const logMessage = context ? `[${context}] ${error.code}: ${error.message}` : `${error.code}: ${error.message}`;

        console.error(logMessage, error.getDetails());

        if (error.originalError) {
            console.error("Original error:", error.originalError);
        }
    }
}
