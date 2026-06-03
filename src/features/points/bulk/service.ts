import { PostBulkPointsRequest, PostBulkPointsResponse } from "./types";
import { PointsBulkService } from "./interface";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { Points } from "@/generated/prisma";
import { ApiError, InternalServerError } from "@/error";

export const PointsBulkServiceImpl: PointsBulkService = {
    /**
     * ポイントをトランザクションで移動する（移動元マイナス・移動先プラスの2件を同時登録）
     * @param {PostBulkPointsRequest} req - リクエスト
     * @return {Promise<PostBulkPointsResponse>} レスポンス
     */
    async postBulkPoints(req: PostBulkPointsRequest): Promise<PostBulkPointsResponse> {
        const pointsRepository = RepositoryFactory.getPointsRepository();
        try {
            const [fromPoint, toPoint] = await RepositoryFactory.withTransaction(async (tx) => {
                const from = await pointsRepository.create(
                    req.eventCode,
                    req.fromTeamCode,
                    -1 * req.points,
                    req.status,
                    tx,
                );
                const to = await pointsRepository.create(
                    req.eventCode,
                    req.toTeamCode,
                    req.points,
                    req.status,
                    tx
                );
                return [from, to];
            });
            return { fromPoint: fromPoint as Points, toPoint: toPoint as Points };
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }
            throw new InternalServerError({
                message: `Failed in ${this.postBulkPoints.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
