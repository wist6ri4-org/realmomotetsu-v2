/**
 * APIハンドラー層テスト用のヘルパー
 */

import * as apiAuth from "@/app/api/utils/auth";
import { LogService } from "@/app/api/utils/logService";
import { Events } from "@/generated/prisma";
import { UsersWithRelations } from "@/repositories/users/UsersRepository";
import { NextRequest, NextResponse } from "next/server";
import { buildEvent, buildUserWithRelations } from "./factories";

/** テストで使うAPIのベースURL */
const BASE_URL = "http://localhost:3001/api/test";

/** テストで使うアクセストークン */
export const TEST_AUTH_TOKEN = "test-access-token";

/** 認証済みリクエストを模すためのヘッダー */
const authHeaders = (): Record<string, string> => ({
    authorization: `Bearer ${TEST_AUTH_TOKEN}`,
});

/**
 * クエリパラメータ付きのGETリクエストを生成する
 * @param {Record<string, string>} searchParams - クエリパラメータ
 * @return {NextRequest} リクエスト
 */
export const buildGetRequest = (searchParams: Record<string, string> = {}): NextRequest => {
    const url = new URL(BASE_URL);
    Object.entries(searchParams).forEach(([key, value]) => url.searchParams.set(key, value));
    return new NextRequest(url, { method: "GET", headers: authHeaders() });
};

/**
 * JSONボディを持つPOSTリクエストを生成する
 * @param {unknown} body - リクエストボディ。文字列を渡した場合はそのまま送信する（不正なJSONの検証用）
 * @return {NextRequest} リクエスト
 */
export const buildPostRequest = (body: unknown): NextRequest =>
    new NextRequest(new URL(BASE_URL), {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeaders() },
        body: typeof body === "string" ? body : JSON.stringify(body),
    });

/**
 * 任意のHTTPメソッドのリクエストを生成する
 * @param {string} method - HTTPメソッド
 * @return {NextRequest} リクエスト
 */
export const buildRequestWithMethod = (method: string): NextRequest =>
    new NextRequest(new URL(BASE_URL), { method, headers: authHeaders() });

/**
 * 認証ヘッダーを持たないリクエストを生成する
 * @param {object} [options] - オプション
 * @param {string} [options.method] - HTTPメソッド（既定はGET）
 * @param {unknown} [options.body] - JSONボディ（指定した場合はcontent-typeも付与する）
 * @return {NextRequest} リクエスト
 * @description 認証ゲート自体を検証するテストで使う
 */
export const buildUnauthenticatedRequest = (options: { method?: string; body?: unknown } = {}): NextRequest => {
    const { method = "GET", body } = options;

    if (body === undefined) {
        return new NextRequest(new URL(BASE_URL), { method });
    }

    return new NextRequest(new URL(BASE_URL), {
        method,
        headers: { "content-type": "application/json" },
        body: typeof body === "string" ? body : JSON.stringify(body),
    });
};

/**
 * レスポンスのステータスコードとJSONボディを取り出す
 * @param {NextResponse} response - レスポンス
 * @return {Promise<{ status: number; body: Record<string, unknown> }>} ステータスコードとボディ
 */
export const readResponse = async (
    response: NextResponse
): Promise<{ status: number; body: Record<string, unknown> }> => ({
    status: response.status,
    body: (await response.json()) as Record<string, unknown>,
});

/**
 * LogServiceの出力を抑止する
 * @description APIハンドラーはリクエストごとにアクセスログを出力するため、
 *              テスト結果が読みづらくならないようモックする。
 */
export const silenceApiLogs = (): void => {
    jest.spyOn(LogService, "logAccess").mockImplementation(() => {});
    jest.spyOn(LogService, "logError").mockImplementation(() => {});
    jest.spyOn(LogService, "logInfo").mockImplementation(() => {});
    jest.spyOn(LogService, "logDebug").mockImplementation(() => {});
};

/** `mockApiAuth` が差し替えたモック */
export type ApiAuthMocks = {
    resolveAuthUser: jest.SpyInstance;
    assertEventAccess: jest.SpyInstance;
};

/**
 * 認証・認可を通過させるためのモックを設定する
 *
 * `BaseApiHandler.handle()` はハンドラー実行前に `resolveAuthUser()` を呼ぶため、
 * DBとSupabase Authに触れずにハンドラー本体を検証できるようモックに差し替える。
 *
 * `assertSelfOrMasterAdmin` はDB・ネットワークに触れない純粋な同期関数のため、
 * ここではモックしない。本人/master admin判定を検証するテスト
 * （UsersUuidApiHandler・InitApiHandler）は `mockApiAuth({ user })` で
 * 認証済みユーザーのuuid/masterRoleを差し替え、実装をそのまま通す。
 *
 * @param {object} [options] - オプション
 * @param {UsersWithRelations} [options.user] - 認証済みユーザーとして返す値
 * @param {Events} [options.event] - `assertEventAccess` が返すイベント
 * @return {ApiAuthMocks} 差し替えたモック（認可拒否の検証などで上書きできる）
 */
export const mockApiAuth = (options: { user?: UsersWithRelations; event?: Events } = {}): ApiAuthMocks => {
    const user = options.user ?? buildUserWithRelations();
    const event = options.event ?? buildEvent();

    return {
        resolveAuthUser: jest.spyOn(apiAuth, "resolveAuthUser").mockResolvedValue(user),
        assertEventAccess: jest.spyOn(apiAuth, "assertEventAccess").mockResolvedValue(event),
    };
};
