import { PropertyPurchases } from "@/generated/prisma";
import { PropertyPurchasesWithRelations } from "@/repositories/propertyPurchases/PropertyPurchasesRepository";

/**
 * 物件駅情報の取得リクエスト
 * @property { string } eventCode - イベントコード
 */
export type GetPropertyPurchasesRequest = {
    eventCode: string;
}

/**
 * 物件駅情報の取得レスポンス
 * @property { PropertyPurchasesWithRelations[] } propertyPurchases - イベントに関連する物件駅購入情報のリスト
 */
export type GetPropertyPurchasesResponse = {
    propertyPurchases: PropertyPurchasesWithRelations[];
}

/**
 * 物件駅購入の追加リクエスト
 * @property { string } eventCode - イベントコード
 * @property { string } teamCode - チームコード
 * @property { string } stationCode - 駅コード
 */
export type PostPropertyPurchasesRequest = {
    eventCode: string;
    teamCode: string;
    stationCode: string;
}

/**
 * 物件駅購入の追加レスポンス
 * @property { PropertyPurchases } propertyPurchase - 追加された物件駅購入情報
 */
export type PostPropertyPurchasesResponse = {
    propertyPurchase: PropertyPurchases;
}