import { z } from "zod";
import { VerifyArrivalGoalStationV3Result } from "./types";
import { NearbyStationsSchema, StationsSchema } from "@/generated/zod";

/**
 * 目的駅到着処理（V3）のPOSTリクエストスキーマ
 */
export const PostVerifyArrivalGoalStationV3RequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
    teamCode: z.string().min(1, "チームコードは必須です"),
    nearbyStations: z.array(
        NearbyStationsSchema.extend({
            fromStation: StationsSchema,
            toStation: StationsSchema,
        }),
    ),
    willPurchase: z.boolean(),
});

/**
 * 処理可否チェック（目的駅到着処理（V3））のPOSTレスポンススキーマ
 */
export const PostVerifyArrivalGoalStationV3ResponseSchema = z.object({
    result: z.nativeEnum(VerifyArrivalGoalStationV3Result),
});
