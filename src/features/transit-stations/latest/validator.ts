import { LatestTransitStationsSchema } from "@/generated/zod";
import { z } from "zod";

// 最新経由駅の取得リクエストスキーマ
export const GetLatestTransitStationsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});

// 最新経由駅の取得レスポンススキーマ
export const GetLatestTransitStationsResponseSchema = z.object({
    latestTransitStations: z.array(LatestTransitStationsSchema),
});
