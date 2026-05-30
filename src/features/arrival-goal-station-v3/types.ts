import { PropertyPurchases, Stations } from "@/generated/prisma";
import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";

/**
 * 目的駅到着処理（V3）のリクエスト
 * @property { string } eventCode - イベントコード
 * @property { string } teamCode - チームコード
 * @property { Stations[] } stations - 駅情報
 * @property { NearbyStationsWithRelations[] } nearByStations - 近隣駅の接続情報
 * @property { boolean } willPurchase - 物件駅購入の有無
 */
export type PostArrivalGoalStationV3Request = {
    eventCode: string;
    teamCode: string;
    stations: Stations[];
    nearbyStations: NearbyStationsWithRelations[];
    willPurchase: boolean;
};

/**
 * 目的駅到着処理（V3）のレスポンス
 * @property { TransitStations } transitStation - 登録された経由駅
 */
export type PostArrivalGoalStationV3Response = {
    points: number;
    propertyPurchases: PropertyPurchases | null;
    purchasePoints: number | null;
};
