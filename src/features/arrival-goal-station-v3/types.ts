import { PropertyPurchases, Stations } from "@/generated/prisma";

/**
 * 目的駅到着処理（V3）のリクエスト
 * @property { string } eventTypeCode - イベント種別コード
 * @property { string } eventCode - イベントコード
 * @property { string } teamCode - チームコード
 * @property { Stations[] } stations - 駅情報
 * @property { boolean } willPurchase - 物件駅購入の有無
 */
export type PostArrivalGoalStationV3Request = {
    eventTypeCode: string;
    eventCode: string;
    teamCode: string;
    stations: Stations[];
    willPurchase: boolean;
};

/**
 * 目的駅到着処理（V3）のレスポンス
 * @property { number } points - ポイント
 * @property { PropertyPurchases | null } propertyPurchases - 物件購入情報
 * @property { number | null } purchasePoints - 購入ポイント
 * @property { number } consecutiveGoalCounts - 連続ゴール数
 * @property { number | null } consecutiveGoalBonus - 連続ゴールボーナス
 */
export type PostArrivalGoalStationV3Response = {
    points: number;
    propertyPurchases: PropertyPurchases | null;
    purchasePoints: number | null;
    consecutiveGoalCount: number;
    consecutiveGoalBonus: number | null;
};
