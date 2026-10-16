import { NextRequest } from "next/server";
import { BaseApiHandler } from "./BaseApiHandler";

/**
 * クエリパラメータを扱うAPIハンドラーを生成するファクトリ関数
 * @param HandlerClass - ハンドラークラスのコンストラクタ
 * @return {Function} - APIリクエストを処理する関数
 */
export function createApiHandler(
    HandlerClass: new (req: NextRequest) => BaseApiHandler
): (req: NextRequest) => Promise<Response> {
    return async function (req: NextRequest) {
        const handler = new HandlerClass(req);
        return await handler.handle();
    };
}

/**
 * URLパラメータを扱うAPIハンドラーを生成するファクトリ関数
 * @param HandlerClass - ハンドラークラスのコンストラクタ
 * @return {Function} - APIリクエストを処理する関数
 */
export function createApiHandlerWithParams<T extends Record<string, string>>(
    HandlerClass: new (req: NextRequest, params: T) => BaseApiHandler
): (req: NextRequest, context: { params: Promise<T> }) => Promise<Response> {
    return async function (req: NextRequest, { params }: { params: Promise<T> }) {
        const resolvedParams = await params; // paramsをawaitしてからハンドラーを作成
        const handler = new HandlerClass(req, resolvedParams);
        return await handler.handle();
    };
}
