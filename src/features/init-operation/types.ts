import { TeamData } from "@/types/TeamData";

/**
 * オペレーション画面の初期化リクエスト
 * @property { string } eventCode - イベントコード
 */
export type InitOperationRequest = {
    eventCode: string;
};

/**
 * オペレーション画面の初期化レスポンス
 * @property {TeamData[]} teamData - チームごとのデータ配列
 */
export type InitOperationResponse = {
    teamData: TeamData[];
};
