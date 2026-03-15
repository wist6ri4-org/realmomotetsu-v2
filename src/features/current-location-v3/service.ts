import { CurrentLocationV3Service } from "./interface";
import { PostCurrentLocationV3Request, PostCurrentLocationV3Response } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { ApiError, InternalServerError } from "@/error";

export const CurrentLocationV3ServiceImpl: CurrentLocationV3Service = {
    /**
     * 現在地を登録する
     * @param {PostCurrentLocationV3Request} req - リクエスト
     * @return {Promise<PostCurrentLocationV3Response>} レスポンス
     */
    async postCurrentLocationV3(req: PostCurrentLocationV3Request): Promise<PostCurrentLocationV3Response> {
        const transitStationsRepository = RepositoryFactory.getTransitStationsRepository();

        try {
            const transitStationsData = {
                eventCode: req.eventCode,
                teamCode: req.teamCode,
                stationCode: req.stationCode,
            };

            const transitStation = await transitStationsRepository.create(
                transitStationsData,
            );
            const res: PostCurrentLocationV3Response = {
                transitStation: transitStation,
            };
            return res;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${this.postCurrentLocationV3.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
