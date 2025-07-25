import { UsersWithRelations } from "@/repositories/users/UsersRepository";
import { GetUsersByUuidRequest } from "./types";

export interface UsersByUuidService {
    /**
     * ユーザーをUUIDで取得する
     * @param req - ユーザーを取得するためのリクエスト
     * @returns ユーザー情報
     */
    getUsersByUuid: (req: GetUsersByUuidRequest) => Promise<UsersWithRelations | null>;
}
