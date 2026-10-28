import { ArrivalGoalStationV3Service } from "./interface";
import { PostArrivalGoalStationV3Request, PostArrivalGoalStationV3Response } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { ApiError, DataIntegrityError, InternalServerError } from "@/error";
import { GameLogicUtils } from "@/utils/gameLogicUtils";
import { GameConstants } from "@/constants/gameConstants";
import { notifyEventDataChanged } from "@/lib/realtimeNotifier";

export const ArrivalGoalStationV3ServiceImpl: ArrivalGoalStationV3Service = {
    /**
     * 目的駅到着処理（V3）を実行する
     * @param {PostArrivalGoalStationV3Request} req - リクエスト
     * @return {Promise<PostArrivalGoalStationV3Response>} レスポンス
     */
    async postArrivalGoalStationV3(req: PostArrivalGoalStationV3Request): Promise<PostArrivalGoalStationV3Response> {
        const [nearbyStationsRepository, goalStationsRepository, pointsRepository, transitStationsRepository] =
            await Promise.all([
                RepositoryFactory.getNearbyStationsRepository(),
                RepositoryFactory.getGoalStationsRepository(),
                RepositoryFactory.getPointsRepository(),
                RepositoryFactory.getTransitStationsRepository(),
            ]);

        try {
            // 最新の目的駅コードを取得
            const latestGoalStationCode = (await goalStationsRepository
                .findLatestGoalStation(req.eventCode)
                .then((goalStation) => goalStation?.stationCode)) as string;

            // １つ前の目的駅コードを取得
            const previousGoalStationCode = await goalStationsRepository
                .findPreviousGoalStation(req.eventCode)
                .then((goalStation) => goalStation?.stationCode);

            if (!previousGoalStationCode) {
                throw new DataIntegrityError("目的駅が設定されていません。", {
                    eventCode: req.eventCode,
                });
            }

            // 最新の経由駅を取得
            const latestTransitStation = await transitStationsRepository.findLatestByTeamCode(req.teamCode);
            if (!latestTransitStation) {
                throw new DataIntegrityError("Latest transit station not found for the team. Data integrity issue.", {
                    eventCode: req.eventCode,
                    teamCode: req.teamCode,
                });
            }

            const nearbyStations = await nearbyStationsRepository.findByEventTypeCode(req.eventTypeCode);

            // ポイント計算
            const arrivalPoints = GameLogicUtils.calculateArrivalPrizeV3(
                nearbyStations,
                previousGoalStationCode,
                latestGoalStationCode,
            );

            // 連続ゴールボーナス計算
            const transitStations = await transitStationsRepository.findGoalStationsByEventCode(req.eventCode);
            let consecutiveGoalCount = 1;
            for (const transitStation of transitStations) {
                if (transitStation.teamCode === req.teamCode) {
                    consecutiveGoalCount++;
                } else {
                    break;
                }
            }
            const consecutiveGoalBonus = GameLogicUtils.calculateConsecutiveGoalBonusV3(consecutiveGoalCount);

            // DB登録処理
            const { createdPoints, createdGoalBonusPoints } = await RepositoryFactory.withTransaction(async (tx) => {
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
                    latestTransitStation.id,
                    {
                        isGoal: true,
                    },
                    tx,
                );

                return { createdPoints, createdGoalBonusPoints };
            });

            const res: PostArrivalGoalStationV3Response = {
                points: createdPoints.points,
                consecutiveGoalCount: consecutiveGoalCount,
                consecutiveGoalBonus: createdGoalBonusPoints?.points ?? null,
            };

            await notifyEventDataChanged(req.eventCode);

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
