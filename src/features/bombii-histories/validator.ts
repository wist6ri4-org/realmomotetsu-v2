import { z } from "zod";

// ボンビー履歴のPOSTリクエストスキー
export const postBombiiHistoriesRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
    teamCode: z.string().min(1, "チームコードは必須です"),
});
