import { PointStatus } from "@/generated/prisma";
import { z } from "zod";

// ポイントの取得リクエストスキーマ
export const getPointsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});

// ポイントの登録レスポンススキーマ
export const postPointsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
    teamCode: z.string().min(1, "チームコードは必須です"),
    points: z.number().int("ポイントは整数でなければなりません"),
    status: z.nativeEnum(PointStatus, {
        message: "ステータスは有効な値でなければなりません",
    }),
});

// ポイントの更新リクエストスキーマ
export const putPointsRequestSchema = z.object({
    teamCode: z.string().min(1, "チームコードは必須です"),
});
