import { Role, Users } from "@/generated/prisma";
/**
 * ユーザーの登録リクエスト
 * @property { string } uuid - ユーザーのUUID
 * @property { string } email - ユーザーのメールアドレス
 * @property { string } [nickname] - ユーザーのニックネーム（オプション）
 * @property { Role } [role] - ユーザーの役割（オプション）
 */
export type PostUsersRequest = {
    uuid: string;
    email: string;
    nickname?: string;
    role?: Role;
};

/**
 * ユーザーの登録レスポンス
 * @property { Users } user - 登録されたユーザー情報
 */
export type PostUsersResponse = {
    user: Users;
};
