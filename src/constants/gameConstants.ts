import { PointStatus, StationGrade } from "@/generated/prisma";

/**
 * ゲームに関する定数
 */
export const GameConstants = {
    /** 移動ポイント */
    POINT_FOR_MOVING: 5,
    /** ルーレットから排除する範囲の所要時間(分) */
    ELIMINATION_TIME_RANGE_MINUTES: 15,
    /**
     * 目的駅選択のバケット設定（所要時間の上限と、そのバケットに入る駅の数）
     * @property {number} maxMinutes バケットに入る駅の所要時間の上限(分)
     * @property {number} count バケットに入る駅の数
     * */
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
    /**
     * ポイントステータス
     * @property {string} POINTS ポイント
     * @property {string} SCORED 総資産
     * @property {string} PROPERTY 物件
     * @property {string} REVENUE 収益
     */
    POINT_STATUS: {
        POINTS: "points" as PointStatus,
        SCORED: "scored" as PointStatus,
        PROPERTY: "property" as PointStatus,
        REVENUE: "revenue" as PointStatus,
    } as const,
    // TODO 駅グレードの価格設定は暫定。ゲームバランスを見ながら調整する。
    /**
     * 駅グレード（キーはStationGrade値）
     * @property {string} none グレードなし
     * @property {string} a グレードA
     * @property {string} b グレードB
     * @property {string} c グレードC
     */
    STATION_GRADE: {
        none: {
            value: "none" as StationGrade,
            price: 0,
            plus: 0,
            minus: 0,
        },
        a: {
            value: "a" as StationGrade,
            price: 10_000,
            plus: 2_500,
            minus: 2_500,
        },
        b: {
            value: "b" as StationGrade,
            price: 7_500,
            plus: 1_000,
            minus: 1_000,
        },
        c: {
            value: "c" as StationGrade,
            price: 5_000,
            plus: 500,
            minus: 500,
        },
    } as const,
    // TODO 物件駅の価格設定は暫定。ゲームバランスを見ながら調整する。
    /** 購入済み物件駅到着時の収益率 */
    REVENUE_RATE: 0.1,
    /** イベントバージョン */
    VERSION: {
        /**
         * V01
         * @property {string} path バージョンのパス
         * @property {number} number バージョンの番号
         * */
        V01: {
            path: "v01",
            number: 100,
        },
        /**
         * V02
         * @property {string} path バージョンのパス
         * @property {number} number バージョンの番号
         * */
        V02: {
            path: "v02",
            number: 200,
        },
        /**
         * V03
         * @property {string} path バージョンのパス
         * @property {number} number バージョンの番号
         * */
        V03: {
            path: "v03",
            number: 300,
        },
    } as const,
    /** 到着ポイントの計算に使用する定数 */
    ARRIVAL_PRIZE_V3: {
        /** 基本賞金(万円) */
        BASIC_PRIZE: 5_000,
        /** 駅数ごとの増加額(万円) */
        INCREMENT_PER_STATION_NUMBER: 1_000,
    } as const,
} as const;

export type GameConstants = typeof GameConstants;
