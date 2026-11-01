import { VerifyArrivalGoalStationV3Service } from "./interface";
import {
    PostVerifyArrivalGoalStationV3Request,
    PostVerifyArrivalGoalStationV3Response,
    VerifyArrivalGoalStationV3Result,
} from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { ApiError, DataIntegrityError, InternalServerError } from "@/error";
import { GameLogicUtils } from "@/utils/gameLogicUtils";

export const VerifyArrivalGoalStationV3ServiceImpl: VerifyArrivalGoalStationV3Service = {
    /**
     * 処理可否チェック（目的駅到着処理（V3））を実行する
     * @param {PostVerifyArrivalGoalStationV3Request} req - リクエスト
     * @return {Promise<PostVerifyArrivalGoalStationV3Response>} レスポンス
     */
    async postVerifyArrivalGoalStationV3(
        req: PostVerifyArrivalGoalStationV3Request,
    ): Promise<PostVerifyArrivalGoalStationV3Response> {
        const [nearbyStationsRepository, transitStationsRepository, goalStationsRepository, pointsRepository] =
            await Promise.all([
                RepositoryFactory.getNearbyStationsRepository(),
                RepositoryFactory.getTransitStationsRepository(),
                RepositoryFactory.getGoalStationsRepository(),
                RepositoryFactory.getPointsRepository(),
            ]);

        try {
            let latestGoalStationName = "";
            // 最新の目的駅コード
            const latestGoalStationCode = (await goalStationsRepository
                .findLatestGoalStation(req.eventCode)
                .then((goalStation) => {
                    latestGoalStationName = goalStation?.station.name ?? "";
                    return goalStation?.stationCode;
                })) as string;

            // １つ前の目的駅コード
            const previousGoalStationCode = await goalStationsRepository
                .findPreviousGoalStation(req.eventCode)
                .then((goalStation) => goalStation?.stationCode);

            if (!previousGoalStationCode) {
                throw new DataIntegrityError("目的駅が設定されていません。", {
                    eventCode: req.eventCode,
                });
            }

            const nearbyStations = await nearbyStationsRepository.findByEventTypeCode(req.eventTypeCode);

            // 到着ポイント
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

            // 最新の経由駅コード
            const latestTransitStationCode = await transitStationsRepository
                .findLatestByTeamCode(req.teamCode)
                .then((latestTransitStation) => latestTransitStation?.stationCode);

            // 現在のポイント合計
            const points = await pointsRepository.sumScoredPointsByTeamCode(req.teamCode, req.eventCode);

            // 確認ダイアログ表示用の金額情報
            const amounts = {
                stationName: latestGoalStationName,
                currentPoints: points,
                arrivalPoints,
                consecutiveGoalBonus,
            };

            // 強制登録確認
            if (latestTransitStationCode !== latestGoalStationCode) {
                const warning: PostVerifyArrivalGoalStationV3Response = {
                    result: VerifyArrivalGoalStationV3Result.W01_STATION_MISMATCH,
                    ...amounts,
                };
                return warning;
            }

            // 処理可
            const res: PostVerifyArrivalGoalStationV3Response = {
                result: VerifyArrivalGoalStationV3Result.VERIFIED,
                ...amounts,
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
