import { PostUsersRequest } from "./types";
import { UsersService } from "./interface";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { Users } from "@/generated/prisma";

export const UsersServiceImpl: UsersService = {
    /**
     * ユーザーを登録する
     * @param req - リクエストデータ
     * @return {Promise<Users>} 登録完了したユーザー情報
     */
    async postUsers(req: PostUsersRequest): Promise<Users> {
        const usersRepository = RepositoryFactory.getUsersRepository();
        try {
            return await usersRepository.create({
                uuid: req.uuid,
                email: req.email,
                nickname: req.nickname,
                role: req.role,
            });
        } catch (error) {
            console.error("Error in postUsers:", error);
            throw new Error("Failed to post users");
        }
    },
};
