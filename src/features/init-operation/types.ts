import { Stations, Teams } from "@/generated/prisma";
import { TeamData } from "@/types/TeamData";

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
 * @param closestStations - 近隣の駅の配列（オプション）
 * @param closestStations.stationCode - 駅コード
 * @param closestStations.distance - 現在位置からの距離（km）
 */
export type InitOperationResponse = {
    teams: Teams[];
    stations: Stations[];
    closestStations?: Array<{
        stationCode: string;
        distance: number;
    }>;
    teamData: TeamData[];
};
