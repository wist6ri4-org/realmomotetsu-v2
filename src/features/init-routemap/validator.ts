import { GoalStationsSchema, TeamsSchema } from "@/generated/zod";
import { TeamDataSchema } from "@/types/TeamData";
import { z } from "zod";

// 路線図のリクエストスキーマ
export const InitRoutemapRequestSchema = z.object({
    eventCode: z.string().min(1, "Event code is required"),
});

// 路線図のレスポンススキーマ
export const InitRoutemapResponseSchema = z.object({
    teamData: z.array(TeamDataSchema),
    nextGoalStation: GoalStationsSchema.nullable(),
    bombiiTeam: TeamsSchema.nullable(),
});
