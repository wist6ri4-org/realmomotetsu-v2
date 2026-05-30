import { VerifyArrivalGoalStationV3Service } from "./interface";
import {
    PostVerifyArrivalGoalStationV3Request,
    PostVerifyArrivalGoalStationV3Response,
    VerifyArrivalGoalStationV3Result,
} from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { ApiError, BadRequestError, ConflictError, InternalServerError } from "@/error";
import { GameLogicUtils } from "@/utils/gameLogicUtils";
import { StationGrade } from "@/generated/prisma";
import { GameConstants } from "@/constants/gameConstants";

export const VerifyArrivalGoalStationV3ServiceImpl: VerifyArrivalGoalStationV3Service = {
    /**
     * 処理可否チェック（目的駅到着処理（V3））を実行する
     * @param {PostVerifyArrivalGoalStationV3Request} req - リクエスト
     * @return {Promise<PostVerifyArrivalGoalStationV3Response>} レスポンス
     */
    async postVerifyArrivalGoalStationV3(
        req: PostVerifyArrivalGoalStationV3Request,
    ): Promise<PostVerifyArrivalGoalStationV3Response> {
        const [transitStationsRepository, propertyPurchasesRepository, goalStationsRepository, pointsRepository] =
            await Promise.all([
                RepositoryFactory.getTransitStationsRepository(),
                RepositoryFactory.getPropertyPurchasesRepository(),
                RepositoryFactory.getGoalStationsRepository(),
                RepositoryFactory.getPointsRepository(),
            ]);

        try {
            let latestGoalStationGrade: StationGrade | null = null;
            /* 購入可否チェック処理 */
            // 最新の目的駅コード
            const latestGoalStationCode = (await goalStationsRepository
                .findLatestGoalStation(req.eventCode)
                .then((goalStation) => {
                    latestGoalStationGrade = goalStation?.station.stationGrade ?? null;
                    return goalStation?.stationCode;
                })) as string;

            // １つ前の目的駅コード
            const previousGoalStationCode = (await goalStationsRepository
                .findPreviousGoalStation(req.eventCode)
                .then((goalStation) => goalStation?.stationCode)) as string;

            // 到着ポイント
            const arrivalPoints = GameLogicUtils.calculateArrivalPrizeV3(
                req.nearbyStations,
                previousGoalStationCode,
                latestGoalStationCode,
            );

            // 最新の経由駅コード
            const latestTransitStationCode = await transitStationsRepository
                .findLatestByTeamCode(req.teamCode)
                .then((latestTransitStation) => latestTransitStation?.stationCode);

            // 目的駅購入状態
            const isPurchased = await propertyPurchasesRepository
                .findByEventCodeAndStationCode(req.eventCode, latestGoalStationCode ?? "")
                .then((propertyPurchases) => propertyPurchases != null);

            // 現在のポイント合計
            const points = await pointsRepository.sumScoredPointsByTeamCode(req.teamCode, req.eventCode);

            // 購入対象駅の価格
            const price = GameConstants.STATION_GRADE[latestGoalStationGrade ?? StationGrade.none].price;

            /* エラーチェック */
            // 購入済みエラー
            if (req.willPurchase && isPurchased) {
                throw new ConflictError({
                    errorCode: VerifyArrivalGoalStationV3Result.E01_ALREADY_PURCHASED,
                });
            }

            // ポイント不足エラー
            const hasSufficientPoints = req.willPurchase && (points + arrivalPoints - price < 0);
            if (hasSufficientPoints) {
                throw new BadRequestError({
                    errorCode: VerifyArrivalGoalStationV3Result.E02_INSUFFICIENT_POINTS,
                });
            }

            // 強制登録確認
            if (latestTransitStationCode !== latestGoalStationCode) {
                return {
                    result: VerifyArrivalGoalStationV3Result.W01_STATION_MISMATCH,
                };
            }

            // 処理可
            const res: PostVerifyArrivalGoalStationV3Response = {
                result: VerifyArrivalGoalStationV3Result.VERIFIED,
            };
            return res;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${this.postVerifyArrivalGoalStationV3.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
