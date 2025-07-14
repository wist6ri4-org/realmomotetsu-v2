import { z } from "zod";

export const getGoalStationsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});

export const postGoalStationsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
    stationCode: z.string().min(1, "駅コードは必須です"),
});
