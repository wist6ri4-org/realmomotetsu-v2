import { z } from "zod";

// イベントコードでイベントを取得するためのリクエストスキーマ
export const getEventByEventCodeRequestScheme = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});

