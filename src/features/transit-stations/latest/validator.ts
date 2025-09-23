import { z } from "zod";

// 最新経由駅の取得リクエストスキーマ
export const getLatestTransitStationsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});
