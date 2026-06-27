import {
    GetPropertyPurchasesRequest,
    GetPropertyPurchasesResponse,
    PostPropertyPurchasesRequest,
    PostPropertyPurchasesResponse,
} from "./types";

export interface PropertyPurchasesService {
    /**
     * 物件購入情報の取得
     * @param {GetPropertyPurchasesRequest} req - リクエスト
     * @return {Promise<GetPropertyPurchasesResponse>} レスポンス
     */
    getPropertyPurchasesByEventCode: (req: GetPropertyPurchasesRequest) => Promise<GetPropertyPurchasesResponse>;

    /**
     * 物件購入情報の登録
     * @param {PostPropertyPurchasesRequest} req - リクエスト
     * @return {Promise<PostPropertyPurchasesResponse>} レスポンス
     */
    postPropertyPurchases: (req: PostPropertyPurchasesRequest) => Promise<PostPropertyPurchasesResponse>;
}
