import { z } from "zod";

// 目的駅のGETリクエストスキーマ
export const getGoalStationsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});

// 目的駅のGETレスポンススキーマ
export const postGoalStationsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
    stationCode: z.string().min(1, "駅コードは必須です"),
});
