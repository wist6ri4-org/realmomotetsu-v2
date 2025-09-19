import { GameConstants } from "@/constants/gameConstants";
import { z } from "zod";

// 現在地とポイント登録のPOSTリクエストスキーマ
export const postCurrentLocationRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
    teamCode: z.string().min(1, "チームコードは必須です"),
    stationCode: z.string().min(1, "駅コードは必須です"),
    points: z.number().int("ポイントは整数でなければなりません"),
    status: z.enum([GameConstants.POINT_STATUS.POINTS, GameConstants.POINT_STATUS.SCORED]).optional(),
});
