import { z } from "zod";

// ルーレットページのリクエストスキーマ
export const initRouletteRequestSchema = z.object({
    eventCode: z.string().min(1, "Event code is required"),
});
