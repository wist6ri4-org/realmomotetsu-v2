import { PointStatus } from "@/generated/prisma";
import { PointsSchema } from "@/generated/zod";
import { z } from "zod";

// ポイント移動の登録リクエストスキーマ
export const PostBulkPointsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
    fromTeamCode: z.string().min(1, "移動元チームコードは必須です"),
    toTeamCode: z.string().min(1, "移動先チームコードは必須です"),
    points: z.number().int("ポイントは整数でなければなりません").positive("ポイントは正の数でなければなりません"),
    status: z.nativeEnum(PointStatus, {
        message: "ステータスは有効な値でなければなりません",
    }),
});

// ポイント移動の登録レスポンススキーマ
export const PostBulkPointsResponseSchema = z.object({
    fromPoint: PointsSchema,
    toPoint: PointsSchema,
});
