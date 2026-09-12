/**
 * APIハンドラー層テスト用のヘルパー
 */

import { LogService } from "@/app/api/utils/logService";
import { NextRequest, NextResponse } from "next/server";

/** テストで使うAPIのベースURL */
const BASE_URL = "http://localhost:3001/api/test";

/**
 * クエリパラメータ付きのGETリクエストを生成する
 * @param {Record<string, string>} searchParams - クエリパラメータ
 * @return {NextRequest} リクエスト
 */
export const buildGetRequest = (searchParams: Record<string, string> = {}): NextRequest => {
    const url = new URL(BASE_URL);
    Object.entries(searchParams).forEach(([key, value]) => url.searchParams.set(key, value));
    return new NextRequest(url, { method: "GET" });
};

/**
 * JSONボディを持つPOSTリクエストを生成する
 * @param {unknown} body - リクエストボディ。文字列を渡した場合はそのまま送信する（不正なJSONの検証用）
 * @return {NextRequest} リクエスト
 */
export const buildPostRequest = (body: unknown): NextRequest =>
    new NextRequest(new URL(BASE_URL), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: typeof body === "string" ? body : JSON.stringify(body),
    });

/**
 * 任意のHTTPメソッドのリクエストを生成する
 * @param {string} method - HTTPメソッド
 * @return {NextRequest} リクエスト
 */
export const buildRequestWithMethod = (method: string): NextRequest =>
    new NextRequest(new URL(BASE_URL), { method });

/**
 * レスポンスのステータスコードとJSONボディを取り出す
 * @param {NextResponse} response - レスポンス
 * @return {Promise<{ status: number; body: Record<string, unknown> }>} ステータスコードとボディ
 */
export const readResponse = async (
    response: NextResponse,
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
