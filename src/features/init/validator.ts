import { z } from "zod";

// フォームページのリクエストスキーマ
export const initRequestSchema = z.object({
    eventCode: z.string().min(1, "Event code is required"),
    uuid: z.string().min(1, "UUID is required"),
});
