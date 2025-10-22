import { ApiError, InternalServerError } from "@/error";
import { BombiiHistoriesService } from "./interface";
import { PostBombiiHistoriesRequest, PostBombiiHistoriesResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";

export const BombiiHistoriesServiceImpl: BombiiHistoriesService = {
    /**
     * ボンビー履歴を登録する
     * @param {PostBombiiHistoriesRequest} req - リクエスト
     * @return {Promise<PostBombiiHistoriesResponse>} レスポンス
     */
    async postBombiiHistories(req: PostBombiiHistoriesRequest): Promise<PostBombiiHistoriesResponse> {
        const bombiiHistoriesRepository = RepositoryFactory.getBombiiHistoriesRepository();

        try {
            const bombiiHistory = await bombiiHistoriesRepository.create({
                eventCode: req.eventCode,
                teamCode: req.teamCode,
            });
            const res: PostBombiiHistoriesResponse = {
                bombiiHistory: bombiiHistory,
            };
            return res;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${this.postBombiiHistories.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
