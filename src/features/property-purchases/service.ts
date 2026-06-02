import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { PropertyPurchasesService } from "./interface";
import {
    GetPropertyPurchasesRequest,
    GetPropertyPurchasesResponse,
    PostPropertyPurchasesRequest,
    PostPropertyPurchasesResponse,
} from "./types";
import { ApiError, InternalServerError } from "@/error";

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

        try {
            const propertyPurchase = await propertyPurchasesRepository.create({
                eventCode: req.eventCode,
                teamCode: req.teamCode,
                stationCode: req.stationCode,
            });
            const res: PostPropertyPurchasesResponse = {
                propertyPurchase,
            };
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
