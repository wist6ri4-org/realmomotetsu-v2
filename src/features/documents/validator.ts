import { z } from "zod";

// ドキュメントのGETリクエストスキーマ
export const getDocumentsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});
