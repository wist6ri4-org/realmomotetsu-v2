import { NextRequest, NextResponse } from "next/server";

export type MethodHandler = (req: NextRequest) => Promise<NextResponse>;

/**
 * HTTPメソッドごとのハンドラーを定義するインターフェース
 */
export interface Handlers {
    GET?: MethodHandler;
    POST?: MethodHandler;
    PUT?: MethodHandler;
    DELETE?: MethodHandler;
    [key: string]: MethodHandler | undefined;
}

/**
 * ログコンテキストのインターフェース
 */
export interface LogContext {
    method: string;
    url: string;
    userAgent?: string;
    timestamp: string;
    requestId: string;
}

/**
 * エラーログのインターフェース
 */
export interface ErrorLog extends LogContext {
    error: Error | unknown;
    stackTrace?: string;
}

/**
 * アクセスログのインターフェース
 */
export interface AccessLog extends LogContext {
    statusCode: number;
    responseTime: number;
}
