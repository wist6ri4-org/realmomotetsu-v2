import { LatestTransitStations, NearbyStations, Stations, Teams } from "@/generated/prisma";

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
 * @param teams - チームの配列
 * @param stations - 駅の配列
 * @param closestStations - 近隣の駅の配列（オプション）
 * @param closestStations.stationCode - 駅コード
 * @param closestStations.distance - 現在位置からの距離（km）
 */
export type InitRouletteResponse = {
    teams: Teams[];
    stations: Stations[];
    nearbyStations: NearbyStations[];
    latestTransitStations: LatestTransitStations[];
    closestStations?: Array<{
        stationCode: string;
        distance: number;
    }>;
};
