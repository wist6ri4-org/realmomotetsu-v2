import { PointStatus } from "@/generated/prisma";
import { PointsSchema } from "@/generated/zod";
import { PointsGroupedByTeamCodeSchema } from "@/types/PointsGroupedByTeamCode";
import { z } from "zod";

// ポイントの取得リクエストスキーマ
export const GetPointsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});

// ポイントの取得レスポンススキーマ
export const GetPointsResponseSchema = z.object({
    points: PointsGroupedByTeamCodeSchema,
});

// ポイントの登録レスポンススキーマ
export const PostPointsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
    teamCode: z.string().min(1, "チームコードは必須です"),
    points: z.number().int("ポイントは整数でなければなりません"),
    status: z.nativeEnum(PointStatus, {
        message: "ステータスは有効な値でなければなりません",
    }),
});

// ポイントの登録レスポンススキーマ
export const PostPointsResponseSchema = z.object({
    point: PointsSchema,
});

// ポイントの更新リクエストスキーマ
export const PutPointsRequestSchema = z.object({
    teamCode: z.string().min(1, "チームコードは必須です"),
});

// ポイントの更新レスポンススキーマ
export const PutPointsResponseSchema = z.object({
    count: z.number(),
});
