import { NextRequest, NextResponse } from "next/server";

export type MethodHandler = (req: NextRequest) => Promise<NextResponse>;

export interface Handlers {
    GET?: MethodHandler;
    POST?: MethodHandler;
    PUT?: MethodHandler;
    DELETE?: MethodHandler;
    [key: string]: MethodHandler | undefined;
}

export interface LogContext {
    method: string;
    url: string;
    userAgent?: string;
    timestamp: string;
    requestId: string;
}

export interface ErrorLog extends LogContext {
    error: Error | unknown;
    stackTrace?: string;
}

export interface AccessLog extends LogContext {
    statusCode: number;
    responseTime: number;
}
