import { NextRequest } from "next/server";
import { BaseApiHandler } from "./BaseApiHandler";

// 新しい基底クラスを使用するファクトリ関数
export function createApiHandler(HandlerClass: new (req: NextRequest) => BaseApiHandler) {
    return async function (req: NextRequest) {
        const handler = new HandlerClass(req);
        return await handler.handle();
    };
}
