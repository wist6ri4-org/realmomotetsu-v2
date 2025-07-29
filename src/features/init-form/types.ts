import { Stations, Teams } from "@/generated/prisma";
import { ClosestStation } from "@/types/ClosestStation";

/**
 * 初期化フォームのリクエスト
 * @property { string } eventCode - イベントコード
 * @property { number } [longitude] - 緯度（オプション）
 * @property { number } [latitude] - 経度（オプション）
 */
export type InitFormRequest = {
    eventCode: string;
    longitude?: number;
    latitude?: number;
};

/**
 * 初期化フォームのレスポンス
 * @property {Teams[]} teams - チームの配列
 * @property {Stations[]} stations - 駅の配列
 * @property {ClosestStation[]} [closestStations] - 最寄り駅の配列（オプション）
 */
export type InitFormResponse = {
    teams: Teams[];
    stations: Stations[];
    closestStations?: ClosestStation[];
};
