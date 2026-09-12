import { UsersWithRelations } from "@/repositories/users/UsersRepository";
/**
 * UUIDでユーザーを取得するリクエスト
 * @property { string } uuid - ユーザーのUUID
 */
export type GetUsersByUuidRequest = {
    uuid: string;
};

/**
 * UUIDでユーザーを取得するレスポンス
 * @property { UsersWithRelations } user - 取得したユーザー情報（関連情報を含む）
 */
export type GetUsersByUuidResponse = {
    user: UsersWithRelations;
};

/**
 * UUIDでユーザーを更新するリクエスト
 * @property { string } uuid - ユーザーのUUID
 * @property { string } [nickname] - ユーザーのニックネーム（オプション）
 * @property { string } [email] - ユーザーのメールアドレス（オプション）
 * @property { string } [iconUrl] - ユーザーのアイコンURL（オプション）
 */
export type PutUsersByUuidRequest = {
    uuid: string;
    nickname?: string;
    email?: string;
    iconUrl?: string;
};

/**
 * UUIDでユーザーを更新するレスポンス
 * @property { UsersWithRelations } user - 更新されたユーザー情報（関連情報を含む）
 */
export type PutUsersByUuidResponse = {
    user: UsersWithRelations;
};
