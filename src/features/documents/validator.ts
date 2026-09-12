import { DocumentsSchema } from "@/generated/zod";
import { z } from "zod";

// ドキュメントのGETリクエストスキーマ
export const GetDocumentsRequestSchema = z.object({
    eventCode: z.string().min(1, "イベントコードは必須です"),
});

// ドキュメントのGETレスポンススキーマ
export const GetDocumentsResponseSchema = z.object({
    documents: z.array(DocumentsSchema),
});
