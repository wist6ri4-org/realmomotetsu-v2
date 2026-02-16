import { PointStatus } from "@/generated/prisma";

/**
 * ゲームに関する定数
 */
export const GameConstants = {
    // 移動ポイント
    POINT_FOR_MOVING: 5,
    // ルーレットから排除する範囲の所要時間(分)
    ELIMINATION_TIME_RANGE_MINUTES: 15,
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
