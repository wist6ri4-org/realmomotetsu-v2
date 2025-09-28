import { PostUsersRequest, PostUsersResponse } from "./types";
import { UsersService } from "./interface";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { Users } from "@/generated/prisma";
import { ApiError, InternalServerError } from "@/error";

export const UsersServiceImpl: UsersService = {
    /**
     * ユーザーを登録する
     * @param req - リクエストデータ
     * @return {Promise<Users>} 登録完了したユーザー情報
     */
    async postUsers(req: PostUsersRequest): Promise<PostUsersResponse> {
        const usersRepository = RepositoryFactory.getUsersRepository();
        try {
            const user = await usersRepository.create({
                uuid: req.uuid,
                email: req.email,
                nickname: req.nickname,
                role: req.role,
            });
            const res: PostUsersResponse = {
                user: user as Users,
            };
            return res;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${arguments.callee.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
