import { GoalStationsSchema } from "@/generated/zod";
import { z } from "zod";

// 目的駅のPOSTレスポンススキーマ
export const PostGoalStationsV3RequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
    stationCode: z.string().min(1, "駅コードは必須です"),
});

// 目的駅のPOSTレスポンススキーマ
export const PostGoalStationsV3ResponseSchema = z.object({
    goalStation: GoalStationsSchema,
});
