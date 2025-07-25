import { UsersWithRelations } from "@/repositories/users/UsersRepository";
/**
 * UUIDでユーザーを取得するリクエスト
 */
export type GetUsersByUuidRequest = {
    uuid: string;
};

/**
 * UUIDでユーザーを取得するレスポンス
 */
export type GetUsersByUuidResponse = UsersWithRelations;
