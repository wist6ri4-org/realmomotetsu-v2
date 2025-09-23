import { Events } from "@/generated/prisma";
/**
 * イベントコードでイベントを取得するリクエスト
 * @property { string } eventCode - イベントコード
 */
export type GetEventByEventCodeRequest = {
    eventCode: string;
};

/**
 * イベントコードでイベントを取得するレスポンス
 * @property { Events | null } event - イベント情報
 */
export type GetEventByEventCodeResponse = {
    event: Events | null;
};
