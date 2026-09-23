import { PointsSchema, StationTypeSchema, TransitStationsSchema } from "@/generated/zod";
import { z } from "zod";

// 現在地登録のPOSTリクエストスキーマ
export const PostCurrentLocationV3RequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
    teamCode: z.string().min(1, "チームコードは必須です"),
    stationCode: z.string().min(1, "駅コードは必須です"),
});

// 現在地登録のPOSTレスポンススキーマ
export const PostCurrentLocationV3ResponseSchema = z.object({
    transitStation: TransitStationsSchema,
    point: PointsSchema.optional(),
    teamDiscordWebhookUrl: z.string().url().optional(),
    stationType: StationTypeSchema.optional(),
});
