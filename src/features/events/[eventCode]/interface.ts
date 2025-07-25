import { GetEventByEventCodeRequest } from "./types";
import { Events } from "@/generated/prisma";

export interface EventByEventCodeService {
    /**
     * イベントコードでイベントを取得する
     * @param req - イベントを取得するためのリクエスト
     * @returns イベント情報
     */
    getEventByEventCode: (req: GetEventByEventCodeRequest) => Promise<Events | null>;
}
