import {
    GetPointsRequest,
    GetPointsResponse,
    PostPointsRequest,
    PostPointsResponse,
    PutPointsRequest,
    PutPointsResponse,
} from "./types";
import { PointsService } from "./interface";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { Points } from "@/generated/prisma";
import { ApiError, InternalServerError } from "@/error";

export const PointsServiceImpl: PointsService = {
    /**
     * イベントコードに紐づくポイントをチームコードごとに取得する
     * @param {GetPointsRequest} req - リクエスト
     * @return {Promise<GetPointsResponse>} レスポンス
     */
    async getPointsByEventCodeGroupedByTeamCode(req: GetPointsRequest): Promise<GetPointsResponse> {
        const pointsRepository = RepositoryFactory.getPointsRepository();

        try {
            // ポイントを取得
            const eventCode = req.eventCode;
            const points = await pointsRepository.findByEventCode(eventCode);

            // レスポンスの作成
            const res: GetPointsResponse = { points: {} };
            points.forEach((point) => {
                if (!res.points[point.teamCode]) {
                    res.points[point.teamCode] = { points: [], scored: [] };
                }
                if (!res.points[point.teamCode][point.status]) {
                    res.points[point.teamCode][point.status] = [];
                }
                res.points[point.teamCode][point.status].push(point);
            });
            return res;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${this.getPointsByEventCodeGroupedByTeamCode.name}. ${
                    error instanceof Error ? error.message : ""
                }`,
            });
        }
    },

    /**
     * ポイントを登録する
     * @param {PostPointsRequest} req - リクエスト
     * @return {Promise<PostPointsResponse>} レスポンス
     */
    async postPoints(req: PostPointsRequest): Promise<PostPointsResponse> {
        const pointsRepository = RepositoryFactory.getPointsRepository();
        try {
            const point = await pointsRepository.create(req.eventCode, req.teamCode, req.points, req.status);
            const res: PostPointsResponse = {
                point: point as Points,
            };
            return res;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${this.postPoints.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },

    /**
     * ポイントのステータスを更新する
     * @param {PutPointsRequest} req - リクエスト
     * @return {Promise<PutPointsResponse>} レスポンス
     */
    async putPoints(req: PutPointsRequest): Promise<PutPointsResponse> {
        const pointRepository = RepositoryFactory.getPointsRepository();
        try {
            return await pointRepository.updateStatusByTeamCode(req.teamCode, "scored");
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${this.putPoints.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
