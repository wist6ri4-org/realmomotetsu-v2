import { EventsSchema, PropertyPurchasesSchema, StationsSchema, TeamsSchema } from "@/generated/zod";
import { z } from "zod";

/**
 * 物件駅情報のGETリクエストスキーマ
 */
export const GetPropertyPurchasesRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});

/**
 * 物件駅情報のGETレスポンススキーマ
 */
export const GetPropertyPurchasesResponseSchema = z.object({
    propertyPurchases: z.array(
        PropertyPurchasesSchema.extend({
            event: EventsSchema,
            team: TeamsSchema,
            station: StationsSchema,
        }),
    ),
});

/**
 * 物件駅情報のPOSTリクエストスキーマ
 */
export const PostPropertyPurchasesRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
    teamCode: z.string().min(1, "チームコードは必須です"),
    stationCode: z.string().min(1, "駅コードは必須です"),
});

/**
 * 物件駅情報のPOSTレスポンススキーマ
 */
export const PostPropertyPurchasesResponseSchema = z.object({
    propertyPurchase: PropertyPurchasesSchema,
});
