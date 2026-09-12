// import { NextRequest, NextResponse } from "next/server";

// export async function middleware(request: NextRequest) {
//     // デバッグ用ログを追加
//     console.log("🔍 Middleware triggered for:", request.nextUrl.pathname);
//     console.log("🔍 Request method:", request.method);
//     // API ルートのみ認証チェック（簡易版）
//     if (request.nextUrl.pathname.startsWith("/api/")) {
//         // Authorization ヘッダーをチェック
//         const authHeader = request.headers.get("Authorization");
//         console.log("Authorization Header:", authHeader);

//         if (!authHeader || !authHeader.startsWith("Bearer ")) {
//             // APIへの未認証アクセスは拒否
//             if (
//                 request.nextUrl.pathname.startsWith("/api/users/") ||
//                 request.nextUrl.pathname.startsWith("/api/init-")
//             ) {
//                 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//             }
//         }
//     }

//     return NextResponse.next();
// }

// export const config = {
//     matcher: ["/api/:path*"],
// };


// TODO ミドルウェアの正式実装
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    // console.log("MIDDLEWARE IS WORKING!", request.nextUrl.pathname);
    return NextResponse.next();
}

export const config = {
    matcher: "/((?!api/hello$).*)",
};
