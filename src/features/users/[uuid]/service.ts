import { UsersByUuidService } from "./interface";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { GetUsersByUuidRequest, GetUsersByUuidResponse } from "./types";

export const UsersByUuidServiceImpl: UsersByUuidService = {
    /**
     * ユーザーを登録する
     * @param {GetUsersByUuidRequest} req - リクエスト
     * @return {Promise<GetUsersByUuidResponse>} レスポンス
     */
    async getUsersByUuid(req: GetUsersByUuidRequest): Promise<GetUsersByUuidResponse> {
        const usersRepository = RepositoryFactory.getUsersRepository();

        try {
            const user = await usersRepository.findByUuid(req.uuid);
            const res: GetUsersByUuidResponse = {
                user: user,
            };
            return res;
        } catch (error) {
            console.error("Error in getUsersByUuid:", error);
            throw new Error("Failed to get users by uuid");
        }
    },
};
