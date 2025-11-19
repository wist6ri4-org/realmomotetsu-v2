import { GoalStationsSchema, StationsSchema } from "@/generated/zod";
import { z } from "zod";

// 最新目的駅のGETリクエストスキーマ
export const GetLatestGoalStationsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});

// 最新目的駅のGETレスポンススキーマ
export const GetLatestGoalStationsResponseSchema = z.object({
    goalStation: GoalStationsSchema.extend({
        station: StationsSchema,
    }),
});
