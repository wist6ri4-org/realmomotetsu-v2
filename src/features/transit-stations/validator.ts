import { TransitStationsSchema } from "@/generated/zod";
import { transitStationsGroupedByTeamCodeSchema } from "@/types/TransitStationsGroupedByTeamCode";
import { z } from "zod";

// 経由駅の取得リクエストスキーマ
export const GetTransitStationsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});

// 経由駅の取得レスポンススキーマ
export const GetTransitStationsResponseSchema = z.object({
    transitStations: transitStationsGroupedByTeamCodeSchema,
});

// 経由駅の登録リクエストスキーマ
export const PostTransitStationsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
    teamCode: z.string().min(1, "チームコードは必須です"),
    stationCode: z.string().min(1, "駅コードは必須です"),
});

// 経由駅の登録レスポンススキーマ
export const PostTransitStationsResponseSchema = z.object({
    transitStation: TransitStationsSchema,
});
