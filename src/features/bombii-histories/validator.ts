import { BombiiHistoriesSchema } from "@/generated/zod";
import { z } from "zod";

// ボンビー履歴のPOSTリクエストスキーマ
export const PostBombiiHistoriesRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
    teamCode: z.string().min(1, "チームコードは必須です"),
});

// ボンビー履歴のPOSTレスポンススキーマ
export const PostBombiiHistoriesResponseSchema = z.object({
    bombiiHistory: BombiiHistoriesSchema,
});
