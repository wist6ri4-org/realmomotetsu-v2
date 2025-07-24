import { z } from "zod";

// ホームページのリクエストスキーマ
export const initHomeRequestSchema = z.object({
    eventCode: z.string().min(1, "Event code is required"),
});

// ホームページのレスポンススキーマ
export const initHomeResponseSchema = z.object({
    teamData: z.array(z.object({
        teamId: z.string(),
        teamName: z.string(),
        score: z.number().int(),
        position: z.string(),
    })),
    nextGoalStation: z.object({
        id: z.string(),
        name: z.string(),
        position: z.string(),
    }).nullable(),
    bombiiTeam: z.object({
        teamId: z.string(),
        teamName: z.string(),
        score: z.number().int().nonnegative(),
        position: z.string(),
    }).nullable(),
});