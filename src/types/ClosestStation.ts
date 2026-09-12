import z from "zod";

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

// 最寄り駅情報のバリデーションスキーマ
export const closestStationSchema = z.object({
    stationCode: z.string(),
    distance: z.number(),
});
