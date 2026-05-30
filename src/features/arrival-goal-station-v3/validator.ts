import { PropertyPurchasesSchema, StationsSchema } from "@/generated/zod";
import { z } from "zod";

/**
 * 目的駅到着処理（V3）のPOSTリクエストスキーマ
 */
export const PostArrivalGoalStationV3RequestSchema = z.object({
    eventTypeCode: z.string().min(1, "イベント種別コードは必須です"),
    eventCode: z.string().min(1, "イベントコードは必須です"),
    teamCode: z.string().min(1, "チームコードは必須です"),
    stations: z.array(StationsSchema),
    willPurchase: z.boolean(),
});

/**
 * 目的駅到着処理（V3）のPOSTレスポンススキーマ
 */
export const PostArrivalGoalStationV3ResponseSchema = z.object({
    points: z.number(),
    propertyPurchases: PropertyPurchasesSchema.nullable(),
    purchasePoints: z.number().nullable(),
});
