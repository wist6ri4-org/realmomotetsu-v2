import { NextRequest } from "next/server";
import { BaseApiHandler } from "./BaseApiHandler";

/**
 * APIハンドラーを生成するファクトリ関数
 * @param HandlerClass - ハンドラークラスのコンストラクタ
 * @return {Function} - APIリクエストを処理する関数
 */
export function createApiHandler(HandlerClass: new (req: NextRequest) => BaseApiHandler) {
    return async function (req: NextRequest) {
        const handler = new HandlerClass(req);
        return await handler.handle();
    };
}
