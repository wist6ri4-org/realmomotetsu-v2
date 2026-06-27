import { ArrivalGoalStationV3Service } from "./interface";
import { PostArrivalGoalStationV3Request, PostArrivalGoalStationV3Response } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { ApiError, BadRequestError, ConflictError, DataIntegrityError, InternalServerError } from "@/error";
import { GameLogicUtils } from "@/utils/gameLogicUtils";
import { GameConstants } from "@/constants/gameConstants";
import { StationGrade } from "@/generated/prisma";
import { VerifyArrivalGoalStationV3Result } from "../verify/verify-arrival-goal-station-v3/types";

export const ArrivalGoalStationV3ServiceImpl: ArrivalGoalStationV3Service = {
    /**
     * 目的駅到着処理（V3）を実行する
     * @param {PostArrivalGoalStationV3Request} req - リクエスト
     * @return {Promise<PostArrivalGoalStationV3Response>} レスポンス
     */
    async postArrivalGoalStationV3(req: PostArrivalGoalStationV3Request): Promise<PostArrivalGoalStationV3Response> {
        const [
            nearbyStationsRepository,
            goalStationsRepository,
            pointsRepository,
            propertyPurchasesRepository,
            transitStationsRepository,
        ] = await Promise.all([
            RepositoryFactory.getNearbyStationsRepository(),
            RepositoryFactory.getGoalStationsRepository(),
            RepositoryFactory.getPointsRepository(),
            RepositoryFactory.getPropertyPurchasesRepository(),
            RepositoryFactory.getTransitStationsRepository(),
        ]);

        try {
            let latestGoalStationGrade: StationGrade | null = null;
            // 最新の目的駅コードを取得
            const latestGoalStationCode = (await goalStationsRepository
                .findLatestGoalStation(req.eventCode)
                .then((goalStation) => {
                    latestGoalStationGrade = goalStation?.station.stationGrade ?? null;
                    return goalStation?.stationCode;
                })) as string;

            // １つ前の目的駅コードを取得
            const previousGoalStationCode = await goalStationsRepository
                .findPreviousGoalStation(req.eventCode)
                .then((goalStation) => goalStation?.stationCode);
            if (!previousGoalStationCode) {
                throw new DataIntegrityError("Previous goal station code not found. Data integrity issue.", {
                    eventCode: req.eventCode,
                });
            }

            // 最新の経由駅を取得
            const latestTransitStation = await transitStationsRepository.findLatestByTeamCode(req.teamCode);

            const nearbyStations = await nearbyStationsRepository.findByEventTypeCode(req.eventTypeCode);

            // ポイント計算
            const arrivalPoints = GameLogicUtils.calculateArrivalPrizeV3(
                nearbyStations,
                previousGoalStationCode,
                latestGoalStationCode,
            );

            // 連続ゴールボーナス計算
            const transitStations = await transitStationsRepository.findGoalStationsByEventCode(req.eventCode);
            let consecutiveGoalCount = 0;
            for (const transitStation of transitStations) {
                if (transitStation.teamCode === req.teamCode) {
                    consecutiveGoalCount++;
                } else {
                    break;
                }
            }
            const consecutiveGoalBonus = GameLogicUtils.calculateConsecutiveGoalBonusV3(consecutiveGoalCount);

            // DB登録処理
            const { createdPoints, createdGoalBonusPoints, createdPropertyPurchases, createdPurchasePoints } =
                await RepositoryFactory.withTransaction(async (tx) => {
                    // E01: 購入済みチェック
                    if (req.willPurchase) {
                        const isPurchased = await propertyPurchasesRepository.findByEventCodeAndStationCode(
                            req.eventCode,
                            latestGoalStationCode,
                            tx,
                        );
                        if (isPurchased) {
                            throw new ConflictError({
                                errorCode: VerifyArrivalGoalStationV3Result.E01_ALREADY_PURCHASED,
                            });
                        }
                    }

                    // E02: ポイント不足チェック
                    if (req.willPurchase) {
                        const currentPoints = await pointsRepository.sumScoredPointsByTeamCode(
                            req.teamCode,
                            req.eventCode,
                            tx,
                        );
                        const price = GameConstants.STATION_GRADE[latestGoalStationGrade ?? StationGrade.none].price;
                        if (currentPoints + arrivalPoints + consecutiveGoalBonus - price < 0) {
                            throw new BadRequestError({
                                errorCode: VerifyArrivalGoalStationV3Result.E02_INSUFFICIENT_POINTS,
                            });
                        }
                    }

                    // ポイント加算
                    const createdPoints = await pointsRepository.create(
                        req.eventCode,
                        req.teamCode,
                        arrivalPoints,
                        GameConstants.POINT_STATUS.SCORED,
                        tx,
                    );

                    // 連続ゴールボーナス加算
                    const createdGoalBonusPoints = await (async () => {
                        if (consecutiveGoalBonus > 0) {
                            return await pointsRepository.create(
                                req.eventCode,
                                req.teamCode,
                                consecutiveGoalBonus,
                                GameConstants.POINT_STATUS.SCORED,
                                tx,
                            );
                        }
                    })();

                    // 最新の経由駅のゴール判定フラグを更新
                    await transitStationsRepository.update(
                        latestTransitStation?.id ?? 0,
                        {
                            isGoal: true,
                        },
                        tx,
                    );

                    // 物件駅を購入する場合
                    if (req.willPurchase) {
                        // 物件駅購入登録
                        const propertyPurchaseData = {
                            eventCode: req.eventCode,
                            teamCode: req.teamCode,
                            stationCode: latestGoalStationCode,
                        };
                        const createdPropertyPurchases = await propertyPurchasesRepository.create(
                            propertyPurchaseData,
                            tx,
                        );
                        const createdPurchasePoints = await pointsRepository.create(
                            req.eventCode,
                            req.teamCode,
                            -1 * GameConstants.STATION_GRADE[latestGoalStationGrade ?? StationGrade.none].price,
                            GameConstants.POINT_STATUS.PROPERTY,
                            tx,
                        );
                        return {
                            createdPoints,
                            createdGoalBonusPoints,
                            createdPropertyPurchases,
                            createdPurchasePoints,
                        };
                    }
                    return {
                        createdPoints,
                        createdGoalBonusPoints,
                        createdPropertyPurchases: null,
                        createdPurchasePoints: null,
                    };
                });

            const res: PostArrivalGoalStationV3Response = {
                points: createdPoints.points,
                propertyPurchases: createdPropertyPurchases,
                purchasePoints: createdPurchasePoints?.points ?? null,
                consecutiveGoalCounts: consecutiveGoalCount,
                consecutiveGoalBonus: createdGoalBonusPoints?.points ?? null,
            };
            return res;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${this.postArrivalGoalStationV3.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
