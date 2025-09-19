import { LatestTransitStations } from "@/generated/prisma";
import { ClosestStation } from "@/types/ClosestStation";

/**
 * ルーレット画面の初期化リクエスト
 * @property { string } eventCode - イベントコード
 * @property { number } [longitude] - 緯度（オプション）
 * @property { number } [latitude] - 経度（オプション）
 */
export type InitRouletteRequest = {
    eventCode: string;
    longitude?: number;
    latitude?: number;
};

/**
 * ルーレット画面の初期化レスポンス
 * @property {LatestTransitStations[]} latestTransitStations - 最新の経由駅の配列
 * @property {ClosestStation[]} [closestStations] - 最寄り駅の配列（オプション）
 */
export type InitRouletteResponse = {
    latestTransitStations: LatestTransitStations[];
    closestStations?: ClosestStation[];
};
