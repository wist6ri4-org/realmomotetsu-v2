import { ArrivalGoalStationV3Service } from "./interface";
import { PostArrivalGoalStationV3Request, PostArrivalGoalStationV3Response } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { ApiError, InternalServerError } from "@/error";
import { GameLogicUtils } from "@/utils/gameLogicUtils";
import { GameConstants } from "@/constants/gameConstants";
import { StationGrade } from "@/generated/prisma";

export const ArrivalGoalStationV3ServiceImpl: ArrivalGoalStationV3Service = {
    /**
     * 目的駅到着処理（V3）を実行する
     * @param {PostArrivalGoalStationV3Request} req - リクエスト
     * @return {Promise<PostArrivalGoalStationV3Response>} レスポンス
     */
    async postArrivalGoalStationV3(req: PostArrivalGoalStationV3Request): Promise<PostArrivalGoalStationV3Response> {
        const [goalStationsRepository, pointsRepository, propertyPurchasesRepository] = await Promise.all([
            RepositoryFactory.getGoalStationsRepository(),
            RepositoryFactory.getPointsRepository(),
            RepositoryFactory.getPropertyPurchasesRepository(),
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
            const previousGoalStationCode = (await goalStationsRepository
                .findPreviousGoalStation(req.eventCode)
                .then((goalStation) => goalStation?.stationCode)) as string;

            // ポイント計算
            const arrivalPoints = GameLogicUtils.calculateArrivalPrizeV3(
                req.nearbyStations,
                previousGoalStationCode,
                latestGoalStationCode,
            );

            // DB登録処理
            const { createdPoints, createdPropertyPurchases, createdPurchasePoints } =
                await RepositoryFactory.withTransaction(async (tx) => {
                    // ポイント加算
                    const createdPoints = await pointsRepository.create(
                        req.eventCode,
                        req.teamCode,
                        arrivalPoints,
                        GameConstants.POINT_STATUS.SCORED,
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
                        return { createdPoints, createdPropertyPurchases, createdPurchasePoints };
                    }
                    return { createdPoints, createdPropertyPurchases: null, createdPurchasePoints: null };
                });

            const res: PostArrivalGoalStationV3Response = {
                points: createdPoints.points,
                propertyPurchases: createdPropertyPurchases,
                purchasePoints: createdPurchasePoints?.points ?? null,
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
