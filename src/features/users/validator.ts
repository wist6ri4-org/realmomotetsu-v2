import { Role } from "@/generated/prisma";
import { z } from "zod";

// ユーザーの登録リクエストスキーマ
export const postUsersRequestSchema = z.object({
    uuid: z.string().min(1, "UUIDは必須です"),
    email: z.string().email().min(1, "メールアドレスは必須です"),
    nickname: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
});

