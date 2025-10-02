import { AttendancesSchema, EventsSchema, UsersSchema } from "@/generated/zod";
import { z } from "zod";

// ユーザーをUUIDで取得するためのリクエストスキーマ
export const GetUsersByUuidRequestScheme = z.object({
    uuid: z.string().min(1, "UUIDは必須です"),
});

// ユーザーをUUIDで取得するためのレスポンススキーマ
export const GetUsersByUuidResponseScheme = z.object({
    user: UsersSchema.extend({
        attendances: z.array(
            AttendancesSchema.extend({
                event: EventsSchema,
            })
        ),
    }),
});

// ユーザーをUUIDで更新するためのリクエストスキーマ
export const PutUsersByUuidRequestScheme = z.object({
    uuid: z.string().min(1, "UUIDは必須です"),
    nickname: z.string().optional(),
    email: z.string().email().optional(),
    iconUrl: z.string().url().optional(),
});

// ユーザーをUUIDで更新するためのレスポンススキーマ
export const PutUsersByUuidResponseScheme = z.object({
    user: UsersSchema.extend({
        attendances: z.array(
            AttendancesSchema.extend({
                event: EventsSchema,
            })
        ),
    }),
});
