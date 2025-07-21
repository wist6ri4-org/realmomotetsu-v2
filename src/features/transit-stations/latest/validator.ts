import { z } from "zod";

export const getLatestTransitStationsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});
