import { UsersByUuidService } from "./interface";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { GetUsersByUuidRequest } from "./types";
import { UsersWithRelations } from "@/repositories/users/UsersRepository";

export const UsersByUuidServiceImpl: UsersByUuidService = {
    /**
     * ユーザーを登録する
     * @param req - リクエストデータ
     * @return {Promise<Users>} 登録完了したユーザー情報
     */
    async getUsersByUuid(req: GetUsersByUuidRequest): Promise<UsersWithRelations | null> {
        const usersRepository = RepositoryFactory.getUsersRepository();

        try {
            return await usersRepository.findByUuid(req.uuid);
        } catch (error) {
            console.error("Error in getUsersByUuid:", error);
            throw new Error("Failed to get users by uuid");
        }
    },
};
