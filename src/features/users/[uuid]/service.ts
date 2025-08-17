import { UsersByUuidService } from "./interface";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import {
    GetUsersByUuidRequest,
    GetUsersByUuidResponse,
    PutUsersByUuidRequest,
    PutUsersByUuidResponse,
} from "./types";

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

    /**
     * ユーザーを更新する
     * @param {PutUsersByUuidRequest} req - リクエスト
     * @return {Promise<PutUsersByUuidResponse>} レスポンス
     */
    async putUsersByUuid(req: PutUsersByUuidRequest): Promise<PutUsersByUuidResponse> {
        const usersRepository = RepositoryFactory.getUsersRepository();

        try {
            // 更新データから uuid を除く
            const { uuid, ...updateData } = req;

            // 空のデータを除外
            const filteredUpdateData = Object.fromEntries(
                Object.entries(updateData).filter(([, value]) => value !== undefined)
            );

            const user = await usersRepository.updateByUuid(uuid, filteredUpdateData);
            const res: PutUsersByUuidResponse = {
                user: user,
            };
            return res;
        } catch (error) {
            console.error("Error in putUsersByUuid:", error);
            throw new Error("Failed to update user by uuid");
        }
    },
};
