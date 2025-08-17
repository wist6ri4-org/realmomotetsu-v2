import { z } from "zod";

// ユーザーをUUIDで取得するためのリクエストスキーマ
export const getUsersByUuidRequestScheme = z.object({
    uuid: z.string().min(1, "UUIDは必須です"),
});

// ユーザーをUUIDで更新するためのリクエストスキーマ
export const putUsersByUuidRequestScheme = z.object({
    uuid: z.string().min(1, "UUIDは必須です"),
    nickname: z.string().optional(),
    email: z.string().email().optional(),
    iconUrl: z.string().url().optional(),
});
