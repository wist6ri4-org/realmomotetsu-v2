import { EventsSchema } from "@/generated/zod";
import { z } from "zod";

// イベントコードでイベントを取得するためのリクエストスキーマ
export const GetEventByEventCodeRequestScheme = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});

export const GetEventByEventCodeResponseSchema = z.object({
    event: EventsSchema,
});
