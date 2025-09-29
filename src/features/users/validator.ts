import { Role } from "@/generated/prisma";
import { UsersSchema } from "@/generated/zod";
import { z } from "zod";

// ユーザーの登録リクエストスキーマ
export const PostUsersRequestSchema = z.object({
    uuid: z.string().min(1, "UUIDは必須です"),
    email: z.string().email().min(1, "メールアドレスは必須です"),
    nickname: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
});

// ユーザーの登録レスポンススキーマ
export const PostUsersResponseSchema = z.object({
    user: UsersSchema,
});

// ユーザーの更新リクエストスキーマ
export const PutUsersRequestSchema = z.object({
    nickname: z.string().optional(),
    email: z.string().email().optional(),
    iconUrl: z.string().url().optional(),
});

// ユーザーの更新レスポンススキーマ
export const PutUsersResponseSchema = z.object({
    user: UsersSchema,
});
