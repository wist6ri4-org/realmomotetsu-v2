import { ClosestStation } from "@/types/ClosestStation";
import { TeamData } from "@/types/TeamData";

/**
 * オペレーション画面の初期化リクエスト
 * @property { string } eventCode - イベントコード
 * @property { number } [longitude] - 緯度（オプション）
 * @property { number } [latitude] - 経度（オプション）
 */
export type InitOperationRequest = {
    eventCode: string;
    longitude?: number;
    latitude?: number;
};

/**
 * オペレーション画面の初期化レスポンス
 * @property {ClosestStation[]} [closestStations] - 最寄り駅の配列（オプション）
 * @property {TeamData[]} teamData - チームごとのデータ配列
 */
export type InitOperationResponse = {
    closestStations?: ClosestStation[];
    teamData: TeamData[];
};
