import { closestStationSchema } from "@/types/ClosestStation";
import { z } from "zod";

// フォームページのリクエストスキーマ
export const InitFormRequestSchema = z.object({
    eventCode: z.string().min(1, "Event code is required"),
});

// フォームページのレスポンススキーマ
export const InitFormResponseSchema = z.object({
    closestStations: z.array(closestStationSchema).optional(),
});
