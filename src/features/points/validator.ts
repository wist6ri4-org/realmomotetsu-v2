import { PointStatus } from "@/generated/prisma";
import { z } from "zod";

export const getPointsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});

export const postPointsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
    teamCode: z.string().min(1, "チームコードは必須です"),
    points: z.number().int("ポイントは整数でなければなりません"),
    status: z.nativeEnum(PointStatus, {
        message: "ステータスは有効な値でなければなりません",
    }),
});

export const putPointsRequestSchema = z.object({
    teamCode: z.string().min(1, "チームコードは必須です"),
});
