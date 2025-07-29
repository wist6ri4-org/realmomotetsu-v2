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
