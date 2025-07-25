import { PostUsersRequest } from "./types";
import { Users } from "@/generated/prisma";

export interface UsersService {
    /**
     * ユーザーを登録する
     * @param req - リクエストデータ
     * @return {Promise<Users>} 登録完了したユーザー情報
     */
    postUsers: (req: PostUsersRequest) => Promise<Users>;
}
