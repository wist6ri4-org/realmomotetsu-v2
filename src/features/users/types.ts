import { Users } from "@/generated/prisma";
/**
 * ユーザーの登録リクエスト
 * @property { string } uuid - ユーザーのUUID
 * @property { string } email - ユーザーのメールアドレス
 * @property { string } [nickname] - ユーザーのニックネーム（オプション）
 */
export type PostUsersRequest = {
    uuid: string;
    email: string;
    nickname?: string;
};

/**
 * ユーザーの登録レスポンス
 * @property { Users } user - 登録されたユーザー情報
 */
export type PostUsersResponse = {
    user: Users;
};

/**
 * ユーザーの更新リクエスト
 * @property { string } [nickname] - ユーザーのニックネーム（オプション）
 * @property { string } [email] - ユーザーのメールアドレス（オプション）
 * @property { string } [iconUrl] - ユーザーのアイコンURL（オプション）
 */
export type PutUsersRequest = {
    nickname?: string;
    email?: string;
    iconUrl?: string;
};

/**
 * ユーザーの更新レスポンス
 * @property { Users } user - 更新されたユーザー情報
 */
export type PutUsersResponse = {
    user: Users;
};
