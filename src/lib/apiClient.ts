import supabase from "@/lib/supabase";

/**
 * 自前の `/api/*` を呼び出すための `fetch` ラッパー。
 *
 * サーバー側の `BaseApiHandler` は既定で認証を必須とし、`Authorization: Bearer <access_token>`
 * ヘッダーを検証する（`src/app/api/utils/auth.ts` の `resolveAuthUser`）。セッションは
 * localStorage 保持（`@supabase/ssr` 未導入）でサーバーは Cookie から JWT を取得できないため、
 * クライアント側でこのヘッダーを付与する必要がある。素の `fetch("/api/...")` を直接呼ぶと
 * 認証ヘッダーが付かず 401 になるため、`/api/*` への呼び出しは必ずこの関数を使うこと。
 *
 * @param {RequestInfo | URL} input - fetchの第1引数と同じ
 * @param {RequestInit} [init] - fetchの第2引数と同じ
 * @return {Promise<Response>} レスポンス
 */
export const apiFetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
    const {
        data: { session },
    } = await supabase.auth.getSession();

    const headers = new Headers(init.headers);
    if (session?.access_token) {
        headers.set("Authorization", `Bearer ${session.access_token}`);
    }

    return fetch(input, { ...init, headers });
};

export default apiFetch;
