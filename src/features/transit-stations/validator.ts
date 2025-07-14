import { z } from "zod";

export const getTransitStationsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});

export const postTransitStationsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
    teamCode: z.string().min(1, "チームコードは必須です"),
    stationCode: z.string().min(1, "駅コードは必須です"),
});
