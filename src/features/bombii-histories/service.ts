import { BombiiHistories } from "@/generated/prisma";
import { BombiiHistoriesService } from "./interface";
import { PostBombiiHistoriesRequest } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";

export const BombiiHistoriesServiceImpl: BombiiHistoriesService = {
    /**
     * ボンビー履歴を登録する
     * @param req - リクエストデータ
     * @return {Promise<BombiiHistories>} 登録されたボンビー履歴
     */
    async postBombiiHistories(req: PostBombiiHistoriesRequest): Promise<BombiiHistories> {
        const bombiiHistoriesRepository = RepositoryFactory.getBombiiHistoriesRepository();

        try {
            return await bombiiHistoriesRepository.create({
                eventCode: req.eventCode,
                teamCode: req.teamCode,
            });
        } catch (error) {
            console.error("Error in postBombiiHistories:", error);
            throw new Error("Failed to register bombii history");
        }
    },
};
