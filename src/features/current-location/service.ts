import { GameConstants } from "@/constants/gameConstants";
import { CurrentLocationService } from "./interface";
import { PostCurrentLocationRequest, PostCurrentLocationResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { ApiError, InternalServerError } from "@/error";

export const CurrentLocationServiceImpl: CurrentLocationService = {
    /**
     * 現在地tとポイントを登録する
     * @param {PostCurrentLocationRequest} req - リクエスト
     * @return {Promise<PostCurrentLocationResponse>} レスポンス
     */
    async postCurrentLocation(req: PostCurrentLocationRequest): Promise<PostCurrentLocationResponse> {
        const transitStationsRepository = RepositoryFactory.getTransitStationsRepository();

        try {
            const transitStationsData = {
                eventCode: req.eventCode,
                teamCode: req.teamCode,
                stationCode: req.stationCode,
            };
            const pointsData = {
                eventCode: req.eventCode,
                teamCode: req.teamCode,
                points: req.points,
                status: req.status || GameConstants.POINT_STATUS.POINTS,
            };

            const { transitStation, point } = await transitStationsRepository.createWithPoints(
                transitStationsData,
                pointsData
            );
            const res: PostCurrentLocationResponse = {
                transitStation: transitStation,
                point: point,
            };
            return res;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${this.postCurrentLocation.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
