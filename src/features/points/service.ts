import { GetPointsRequest, GetPointsResponse, PostPointsRequest, PutPointsRequest } from "./types";
import { PointsService } from "./interface";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { Points } from "@/generated/prisma";

export const PointsServiceImpl: PointsService = {
    /**
     * イベントコードに紐づくポイントをチームコードごとに取得する
     * @param req - リクエストデータ
     * @return {Promise<GetPointsResponse>} チームコードごとにグループ化されたポイント
     */
    async getPointsByEventCodeGroupedByTeamCode(
        req: GetPointsRequest
    ): Promise<GetPointsResponse> {
        const pointsRepository = RepositoryFactory.getPointsRepository();

        try {
            // ポイントを取得
            const eventCode = req.eventCode;
            const points = await pointsRepository.findByEventCode(eventCode);

            // レスポンスの作成
            const res: GetPointsResponse = {};
            points.forEach((point) => {
                if (!res[point.teamCode]) {
                    res[point.teamCode] = { points: [], scored: [] };
                }
                if (!res[point.teamCode][point.status]) {
                    res[point.teamCode][point.status] = [];
                }
                res[point.teamCode][point.status].push(point);
            });
            return res;
        } catch (error) {
            console.error("Error in getPointsByEventCodeGroupedByTeamCode:", error);
            throw new Error("Failed to retrieve points grouped by team code");
        }
    },

    /**
     * ポイントを登録する
     * @param req - リクエストデータ
     * @return {Promise<void>} 登録完了
     */
    async postPoints(req: PostPointsRequest): Promise<Points> {
        const pointsRepository = RepositoryFactory.getPointsRepository();
        try {
            return await pointsRepository.create(req.eventCode, req.teamCode, req.points, req.status);
        } catch (error) {
            console.error("Error in postPoints:", error);
            throw new Error("Failed to post points");
        }
    },

    /**
     * ポイントのステータスを更新する
     * @param req - リクエストデータ
     * @return {Promise<{ count: number }>} 更新されたポイントの数
     */
    async putPoints(req: PutPointsRequest): Promise<{ count: number }> {
        const pointRepository = RepositoryFactory.getPointsRepository();
        try {
            return await pointRepository.updateStatusByTeamCode(req.teamCode, "scored");
        } catch (error) {
            console.error("Error in putPoints:", error);
            throw new Error("Failed to update points status");
        }
    }
};
