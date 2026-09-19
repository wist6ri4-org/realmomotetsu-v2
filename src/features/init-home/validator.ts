import { GoalStationsSchema, StationsSchema, TeamsSchema } from "@/generated/zod";
import { TeamDataSchema } from "@/types/TeamData";
import { z } from "zod";

// ホームページのリクエストスキーマ
export const InitHomeRequestSchema = z.object({
    eventCode: z.string().min(1, "Event code is required"),
});

// ホームページのレスポンススキーマ
export const InitHomeResponseSchema = z.object({
    teamData: z.array(TeamDataSchema),
    nextGoalStation: GoalStationsSchema.extend({
        station: StationsSchema,
    }).nullable(),
    bombiiTeam: TeamsSchema.nullable(),
});
