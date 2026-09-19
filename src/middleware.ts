import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * `/api/*` の認証・認可は `BaseApiHandler.handle()` に集約している
 * （`src/app/api/utils/BaseApiHandler.ts` の `requireAuth()` / `resolveAuthUser()`）。
 * ミドルウェアはページ側のルーティング用に素通りさせるだけで、
 * 追加の認証チェックは行わない（二重管理を避けるため）。
 * @param {NextRequest} request - リクエスト
 * @return {NextResponse} - 次の処理へ進めるレスポンス
 */
export function middleware(request: NextRequest) {
    return NextResponse.next();
}

export const config = {
    matcher: "/((?!api/hello$).*)",
};
