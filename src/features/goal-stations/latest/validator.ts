import { z } from "zod";

// 最新目的駅のGETリクエストスキーマ
export const getLatestGoalStationsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});
