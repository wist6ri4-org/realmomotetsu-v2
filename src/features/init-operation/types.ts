import { Stations, Teams } from "@/generated/prisma";
import { ClosestStation } from "@/types/ClosestStation";
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
 * @property {Teams[]} teams - チームの配列
 * @property {Stations[]} stations - 駅の配列
 * @property {ClosestStation[]} [closestStations] - 最寄り駅の配列（オプション）
 * @property {TeamData[]} teamData - チームごとのデータ配列
 */
export type InitOperationResponse = {
    teams: Teams[];
    stations: Stations[];
    closestStations?: ClosestStation[];
    teamData: TeamData[];
};
