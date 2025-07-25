import { Documents } from "@/generated/prisma";

/**
 * ドキュメントの取得リクエスト
 * @param eventCode - イベントコード
 */
export type GetDocumentsRequest = {
    eventCode: string;
};

/**
 * ドキュメントの取得レスポンス
 * @param stations - ドキュメントの配列
 */
export type GetDocumentsResponse = {
    documents: Documents[];
};
