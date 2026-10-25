import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { PropertyPurchasesService } from "./interface";
import {
    GetPropertyPurchasesRequest,
    GetPropertyPurchasesResponse,
    PostPropertyPurchasesRequest,
    PostPropertyPurchasesResponse,
} from "./types";
import { ApiError, BadRequestError, InternalServerError, NotFoundError } from "@/error";
import { GameConstants } from "@/constants/gameConstants";
import { getMessage } from "@/constants/messages";
import { StationGrade } from "@/generated/prisma";
import { notifyEventDataChanged } from "@/lib/realtimeNotifier";

export const PropertyPurchasesServiceImpl: PropertyPurchasesService = {
    /**
     * イベントコードに紐づく物件駅購入情報を全件取得する
     * @param {GetPropertyPurchasesRequest} req - リクエスト
     * @return {Promise<GetPropertyPurchasesResponse>} レスポンス
     */
    async getPropertyPurchasesByEventCode(req: GetPropertyPurchasesRequest): Promise<GetPropertyPurchasesResponse> {
        const propertyPurchasesRepository = RepositoryFactory.getPropertyPurchasesRepository();

        try {
            const eventCode = req.eventCode;
            const propertyPurchases = await propertyPurchasesRepository.findByEventCode(eventCode);
            const res: GetPropertyPurchasesResponse = {
                propertyPurchases,
            };
            return res;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${this.getPropertyPurchasesByEventCode.name}. ${
                    error instanceof Error ? error.message : ""
                }`,
            });
        }
    },

    /**
     * 物件駅購入情報を登録する
     * @param {PostPropertyPurchasesRequest} req - リクエスト
     * @return {Promise<PostPropertyPurchasesResponse>} レスポンス
     */
    async postPropertyPurchases(req: PostPropertyPurchasesRequest): Promise<PostPropertyPurchasesResponse> {
        const propertyPurchasesRepository = RepositoryFactory.getPropertyPurchasesRepository();
        const pointsRepository = RepositoryFactory.getPointsRepository();
        const stationsRepository = RepositoryFactory.getStationsRepository();

        try {
            const station = await stationsRepository.findByStationCode(req.stationCode);
            if (!station) {
                throw new NotFoundError({ message: `Station not found: ${req.stationCode}` });
            }
            const price = GameConstants.STATION_GRADE[station.stationGrade ?? StationGrade.none].price;

            const propertyPurchase = await RepositoryFactory.withTransaction(async (tx) => {
                // 支払いありの場合は所持金不足をチェック
                if (req.withPayment) {
                    const currentPoints = await pointsRepository.sumScoredPointsByTeamCode(
                        req.teamCode,
                        req.eventCode,
                        tx,
                    );
                    if (currentPoints - price < 0) {
                        throw new BadRequestError({
                            message: getMessage("INSUFFICIENT_POINTS"),
                            errorCode: "INSUFFICIENT_POINTS",
                        });
                    }
                }

                const created = await propertyPurchasesRepository.create(
                    {
                        eventCode: req.eventCode,
                        teamCode: req.teamCode,
                        stationCode: req.stationCode,
                    },
                    tx,
                );

                if (req.withPayment) {
                    await pointsRepository.create(
                        req.eventCode,
                        req.teamCode,
                        -1 * price,
                        GameConstants.POINT_STATUS.PROPERTY,
                        tx,
                    );
                }
                return created;
            });
            const res: PostPropertyPurchasesResponse = {
                propertyPurchase,
            };

            await notifyEventDataChanged(req.eventCode);

            return res;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${this.postPropertyPurchases.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
