import { LatestTransitStations, NearbyStations, Stations } from "@/generated/prisma";
import { ClosestStation } from "@/types/ClosestStation";

/**
 * ルーレット画面の初期化リクエスト
 * @param eventCode - イベントコード
 * @param longitude - 経度（オプション）
 * @param latitude - 緯度（オプション）
 */
export type InitRouletteRequest = {
    eventCode: string;
    longitude?: number;
    latitude?: number;
};

/**
 * ルーレット画面の初期化レスポンス
 * @property {Stations[]} stations - 駅の配列
 * @property {NearbyStations[]} nearbyStations - 近隣駅の配列
 * @property {LatestTransitStations[]} latestTransitStations - 最新の経由駅の配列
 * @property {ClosestStation[]} [closestStations] - 最寄り駅の配列（オプション）
 */
export type InitRouletteResponse = {
    stations: Stations[];
    nearbyStations: NearbyStations[];
    latestTransitStations: LatestTransitStations[];
    closestStations?: ClosestStation[];
};
