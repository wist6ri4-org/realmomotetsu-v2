import { BombiiHistoriesService } from "./interface";
import { PostBombiiHistoriesRequest, PostBombiiHistoriesResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";

export const BombiiHistoriesServiceImpl: BombiiHistoriesService = {
    /**
     * ボンビー履歴を登録する
     * @param {PostBombiiHistoriesRequest} req - リクエスト
     * @return {Promise<PostBombiiHistoriesResponse>} レスポンス
     */
    async postBombiiHistories(
        req: PostBombiiHistoriesRequest
    ): Promise<PostBombiiHistoriesResponse> {
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
            console.error("Error in postBombiiHistories:", error);
            throw new Error("Failed to register bombii history");
        }
    },
};
