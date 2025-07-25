import { Events } from "@/generated/prisma";
/**
 * イベントコードでイベントを取得するリクエスト
 */
export type GetEventByEventCodeRequest = {
    eventCode: string;
};

/**
 * イベントコードでイベントを取得するレスポンス
 */
export type GetEventByEventCodeResponse = Events;
