import { z } from "zod";

// ユーザーをUUIDで取得するためのリクエストスキーマ
export const getUsersByUuidRequestScheme = z.object({
    uuid: z.string().min(1, "UUIDは必須です"),
});

