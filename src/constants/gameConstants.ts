import { PointStatus } from "@/generated/prisma";

/**
 * ゲームに関する定数
 */
export const GameConstants = {
    // 移動ポイント
    POINT_FOR_MOVING: 5,
    // ルーレットから排除する範囲の所要時間(分)
    ELIMINATION_TIME_RANGE_MINUTES: 15,
    // 目的駅選択のバケット設定（所要時間の上限と、そのバケットに入る駅の数）
    STATION_SELECTION_BUCKETS: [
        { maxMinutes: 5, count: 0 },
        { maxMinutes: 10, count: 0 },
        { maxMinutes: 15, count: 0 },
        { maxMinutes: 20, count: 0 },
        { maxMinutes: 25, count: 32 },
        { maxMinutes: 30, count: 4 },
        { maxMinutes: 35, count: 2 },
        { maxMinutes: 40, count: 1 },
        { maxMinutes: Infinity, count: 1 },
    ] as const,
    // ポイントステータス
    POINT_STATUS: {
        POINTS: "points" as PointStatus,
        SCORED: "scored" as PointStatus,
    } as const,
    // イベントバージョン
    VERSION: {
        V01: {
            path: "v01",
            number: 100,
        },
        V02: {
            path: "v02",
            number: 200,
        },
        V03: {
            path: "v03",
            number: 300,
        },
    } as const,
} as const;

export type GameConstants = typeof GameConstants;
