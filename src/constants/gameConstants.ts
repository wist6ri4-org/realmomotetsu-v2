import { PointStatus } from "@/generated/prisma";

export class GameConstants {
    /* 移動ポイント */
    static readonly POINT_FOR_MOVING = 5;
    /* ルーレットから排除する範囲の所要時間 */
    static readonly ELIMINATION_TIME_RANGE_MINUTES = 15;

    static readonly POINT_STATUS = {
        POINTS: "points" as PointStatus,
        SCORED: "scored" as PointStatus,
    } as const;
}