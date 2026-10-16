import { GoalStationsSchema, StationsSchema } from "@/generated/zod";
import { z } from "zod";

// 目的駅のGETリクエストスキーマ
export const GetGoalStationsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});

// 目的駅のGETレスポンススキーマ
export const GetGoalStationsResponseSchema = z.object({
    goalStations: z.array(
        GoalStationsSchema.extend({
            station: StationsSchema,
        })
    ),
});

// 目的駅のPOSTレスポンススキーマ
export const PostGoalStationsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
    stationCode: z.string().min(1, "駅コードは必須です"),
});

// 目的駅のPOSTレスポンススキーマ
export const PostGoalStationsResponseSchema = z.object({
    goalStation: GoalStationsSchema,
});
