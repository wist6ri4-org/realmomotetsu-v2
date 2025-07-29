/**
 * 最寄り駅情報の型定義
 */
export type ClosestStation = {
    /**
     * 駅コード
     */
    stationCode: string;

    /**
     * 距離（メートル）
     */
    distance: number;
};