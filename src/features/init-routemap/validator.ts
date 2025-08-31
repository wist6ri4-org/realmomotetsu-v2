import { z } from "zod";

// 路線図のリクエストスキーマ
export const initRoutemapRequestSchema = z.object({
    eventCode: z.string().min(1, "Event code is required"),
});
