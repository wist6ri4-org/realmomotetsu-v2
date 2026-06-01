import { CurrentLocationV3Service } from "./interface";
import { PostCurrentLocationV3Request, PostCurrentLocationV3Response } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { ApiError, InternalServerError } from "@/error";
import { GameConstants } from "@/constants/gameConstants";
import { StationGrade } from "@/generated/prisma";

export const CurrentLocationV3ServiceImpl: CurrentLocationV3Service = {
    /**
     * 現在地を登録する
     * @param {PostCurrentLocationV3Request} req - リクエスト
     * @return {Promise<PostCurrentLocationV3Response>} レスポンス
     */
    async postCurrentLocationV3(req: PostCurrentLocationV3Request): Promise<PostCurrentLocationV3Response> {
        const [transitStationsRepository, pointsRepository, propertyPurchasesRepository] = await Promise.all([
            RepositoryFactory.getTransitStationsRepository(),
            RepositoryFactory.getPointsRepository(),
            RepositoryFactory.getPropertyPurchasesRepository(),
        ]);

        try {
            const propertyPurchase = await propertyPurchasesRepository.findByEventCodeAndStationCode(
                req.eventCode,
                req.stationCode,
            );

            const transitStationsData = {
                eventCode: req.eventCode,
                teamCode: req.teamCode,
                stationCode: req.stationCode,
            };

            const { transitStation, createdPoints } = await RepositoryFactory.withTransaction(async (tx) => {
                const transitStation = await transitStationsRepository.create(transitStationsData);

                if (propertyPurchase) {
                    // ポイント登録
                    const price =
                        GameConstants.STATION_GRADE[propertyPurchase.station.stationGrade ?? StationGrade.none].price *
                        GameConstants.REVENUE_RATE;

                    const createdPoints = await pointsRepository.create(
                        req.eventCode,
                        req.teamCode,
                        price,
                        GameConstants.POINT_STATUS.REVENUE,
                        tx,
                    );
                    return { transitStation, createdPoints };
                }

                return { transitStation };
            });

            const res: PostCurrentLocationV3Response = {
                transitStation: transitStation,
                point: createdPoints,
                teamDiscordWebhookUrl: propertyPurchase?.team.discordWebhookUrl ?? undefined,
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
