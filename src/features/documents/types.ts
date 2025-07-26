import { Documents } from "@/generated/prisma";

/**
 * ドキュメントの取得リクエスト
 * @property { string } eventCode - イベントコード
 */
export type GetDocumentsRequest = {
    eventCode: string;
};

/**
 * ドキュメントの取得レスポンス
 * @property { Documents[] } documents - イベントに関連するドキュメントのリスト
 */
export type GetDocumentsResponse = {
    documents: Documents[];
};
