import { LatestTransitStationsSchema } from "@/generated/zod";
import { z } from "zod";

// ルーレットページのリクエストスキーマ
export const InitRouletteRequestSchema = z.object({
    eventCode: z.string().min(1, "Event code is required"),
});

// ルーレットページのレスポンススキーマ
export const InitRouletteResponseSchema = z.object({
    latestTransitStations: z.array(LatestTransitStationsSchema),
});
