import { Stations, Teams } from "@/generated/prisma";

/**
 * オペレーション画面の初期化リクエスト
 * @param eventCode - イベントコード
 * @param longitude - 経度（オプション）
 * @param latitude - 緯度（オプション）
 */
export type InitOperationRequest = {
    eventCode: string;
    longitude?: number;
    latitude?: number;
};

/**
 * オペレーション画面の初期化レスポンス
 * @param teams - チームの配列
 * @param stations - 駅の配列
 * @param nearbyStations - 近隣の駅の配列（オプション）
 * @param nearbyStations.stationCode - 駅コード
 * @param nearbyStations.distance - 現在位置からの距離（km）
 */
export type InitOperationResponse = {
    teams: Teams[];
    stations: Stations[];
    nearbyStations?: Array<{
        stationCode: string;
        distance: number;
    }>;
};
