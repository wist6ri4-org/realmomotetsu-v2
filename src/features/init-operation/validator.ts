import { TeamDataSchema } from "@/types/TeamData";
import { z } from "zod";

// オペレーションページのリクエストスキーマ
export const InitOperationRequestSchema = z.object({
    eventCode: z.string().min(1, "Event code is required"),
});

// オペレーションページのレスポンススキーマ
export const InitOperationResponseSchema = z.object({
    teamData: z.array(TeamDataSchema),
});
