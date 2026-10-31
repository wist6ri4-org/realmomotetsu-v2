import { CurrentLocationV3Service } from "./interface";
import { PostCurrentLocationV3Request, PostCurrentLocationV3Response } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { ApiError, DataIntegrityError, InternalServerError } from "@/error";
import { GameConstants } from "@/constants/gameConstants";
import { StationGrade, StationType } from "@/generated/prisma";
import { notifyEventDataChanged } from "@/lib/realtimeNotifier";
import { scheduleCurrentLocationNotifications } from "@/features/discord/notifications";

export const CurrentLocationV3ServiceImpl: CurrentLocationV3Service = {
    /**
     * 現在地を登録する
     * @param {PostCurrentLocationV3Request} req - リクエスト
     * @return {Promise<PostCurrentLocationV3Response>} レスポンス
     */
    async postCurrentLocationV3(req: PostCurrentLocationV3Request): Promise<PostCurrentLocationV3Response> {
        const [stationsRepository, transitStationsRepository, pointsRepository, propertyPurchasesRepository] =
            await Promise.all([
                RepositoryFactory.getStationsRepository(),
                RepositoryFactory.getTransitStationsRepository(),
                RepositoryFactory.getPointsRepository(),
                RepositoryFactory.getPropertyPurchasesRepository(),
            ]);

        try {
            // 駅情報を取得
            const station = await stationsRepository.findByStationCode(req.stationCode);
            if (!station) {
                throw new DataIntegrityError(`Station not found for stationCode: ${req.stationCode}`, {
                    stationCode: req.stationCode,
                });
            }

            // 物件駅の場合、購入済みかどうかを確認
            const propertyPurchase = await propertyPurchasesRepository.findByEventCodeAndStationCode(
                req.eventCode,
                req.stationCode,
            );

            // 経由駅情報の登録用データ
            const transitStationsData = {
                eventCode: req.eventCode,
                teamCode: req.teamCode,
                stationCode: req.stationCode,
            };

            const { transitStation, createdPoints, paymentPoints } = await RepositoryFactory.withTransaction(async (tx) => {
                // 経由駅情報を登録
                const transitStation = await transitStationsRepository.create(transitStationsData, tx);

                // 効果駅の処理
                switch (station?.stationType) {
                    // プラス駅の場合
                    case StationType.plus: {
                        // プラス額
                        const plusPoints = GameConstants.STATION_GRADE[station.stationGrade ?? StationGrade.none].plus;
                        // ポイント登録
                        const createdPoints = await pointsRepository.create(
                            req.eventCode,
                            req.teamCode,
                            plusPoints,
                            GameConstants.POINT_STATUS.SCORED,
                            tx,
                        );
                        return { transitStation, createdPoints };
                    }

                    // マイナス駅の場合
                    case StationType.minus: {
                        // マイナス額
                        const minusPoints =
                            GameConstants.STATION_GRADE[station.stationGrade ?? StationGrade.none].minus;
                        // ポイント登録
                        const createdPoints = await pointsRepository.create(
                            req.eventCode,
                            req.teamCode,
                            minusPoints,
                            GameConstants.POINT_STATUS.SCORED,
                            tx,
                        );
                        return { transitStation, createdPoints };
                    }

                    // ミッション駅/物件駅の場合
                    case StationType.mission: {
                        // 購入済みの物件駅の場合
                        if (propertyPurchase && propertyPurchase.teamCode != req.teamCode) {
                            // 収益額
                            const revenue =
                                GameConstants.STATION_GRADE[propertyPurchase.station.stationGrade ?? StationGrade.none]
                                    .price * GameConstants.REVENUE_RATE;

                            // 所有チームの収益を登録
                            const createdPoints = await pointsRepository.create(
                                req.eventCode,
                                propertyPurchase.teamCode,
                                revenue,
                                GameConstants.POINT_STATUS.REVENUE,
                                tx,
                            );
                            // 到着したチームの支払いを登録
                            const paymentPoints = await pointsRepository.create(
                                req.eventCode,
                                req.teamCode,
                                -revenue,
                                GameConstants.POINT_STATUS.REVENUE,
                                tx,
                            );
                            return { transitStation, createdPoints, paymentPoints };
                        } else {
                            return { transitStation };
                        }
                    }

                    default:
                        return { transitStation };
                }
            });

            await scheduleCurrentLocationNotifications(
                transitStation,
                createdPoints && propertyPurchase
                    ? {
                          ownerDiscordWebhookUrl: propertyPurchase.team.discordWebhookUrl,
                          ownerTeamName: propertyPurchase.team.teamName,
                          payerTeamCode: req.teamCode,
                          points: createdPoints.points,
                          stationName: station.name,
                      }
                    : undefined,
            );

            const res: PostCurrentLocationV3Response = {
                transitStation: transitStation,
                point: createdPoints,
                paymentPoint: paymentPoints,
                stationType: station.stationType ?? undefined,
                isPurchased: propertyPurchase != null,
            };

            await notifyEventDataChanged(req.eventCode);

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
