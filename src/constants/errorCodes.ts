/**
 * アプリケーションエラーコード定数
 */
export const ErrorCodes = {
    // 共通エラー
    UNKNOWN_ERROR: "UNKNOWN_ERROR",
    NETWORK_ERROR: "NETWORK_ERROR",
    SERVER_ERROR: "SERVER_ERROR",

    // バリデーションエラー
    VALIDATION_ERROR: "VALIDATION_ERROR",
    REQUIRED_FIELD_ERROR: "REQUIRED_FIELD_ERROR",
    INVALID_FORMAT_ERROR: "INVALID_FORMAT_ERROR",
    VALUE_OUT_OF_RANGE_ERROR: "VALUE_OUT_OF_RANGE_ERROR",

    // APIエラー
    API_REQUEST_FAILED: "API_REQUEST_FAILED",
} as const;

export type ErrorCodes = typeof ErrorCodes;
