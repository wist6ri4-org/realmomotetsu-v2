import { LatestTransitStations } from "@/generated/prisma";

/**
 * ルーレット画面の初期化リクエスト
 * @property { string } eventCode - イベントコード
 */
export type InitRouletteRequest = {
    eventCode: string;
};

/**
 * ルーレット画面の初期化レスポンス
 * @property {LatestTransitStations[]} latestTransitStations - 最新の経由駅の配列
 */
export type InitRouletteResponse = {
    latestTransitStations: LatestTransitStations[];
};
