import { PointStatus, StationGrade } from "@/generated/prisma";

/**
 * ゲームに関する定数
 */
export const GameConstants = {
    // ========== 共通 ==========
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

    // ========== V2 ==========
    /** 移動ポイント */
    POINT_FOR_MOVING: 5,

    /** ルーレットから排除する範囲の所要時間(分) */
    ELIMINATION_TIME_RANGE_MINUTES: 15,

    // ========== V3 ==========
    // TODO 所要時間で昇順ソートしたときの上位%と、そのバケットに入る駅の数は暫定。ゲームバランスを見ながら調整する。
    /**
     * 目的駅選択のバケット設定（所要時間で昇順ソートしたときの上位%と、そのバケットに入る駅の数）
     * @property {number} percentile 所要時間で昇順ソートしたときの上位%
     * @property {number} count バケットに入る駅の数
     */
    STATION_SELECTION_RATIO_BUCKETS: [
        { percentile: 10, count: 0 },
        { percentile: 20, count: 0 },
        { percentile: 30, count: 0 },
        { percentile: 40, count: 0 },
        { percentile: 50, count: 0 },
        { percentile: 60, count: 1 },
        { percentile: 70, count: 1 },
        { percentile: 80, count: 2 },
        { percentile: 90, count: 2 },
        { percentile: 100, count: 1 },
    ] as const,

    /**
     * 端駅からランダムに選択する駅の数
     */
    CANDIDATE_END_STATIONS_NUM: 1,

    /**
     * 端駅の駅コード（V3）
     * NOTE 実装コストを考慮しコード側で定数として持つ。将来的にDBから取得するように変更する可能性あり。
     */
    END_STATION_CODES_V3: [
        "METRO_V1_AKABANE-IWABUCHI",
        "METRO_V1_OGIKUBO",
        "METRO_V1_KITA-AYASE",
        "METRO_V1_SHIN-KIBA",
        "METRO_V1_NAKANO",
        "METRO_V1_NAKA-MEGURO",
        "METRO_V1_NISHI-TAKASHIMADAIRA",
        "METRO_V1_NISHI-FUNABASHI",
        "METRO_V1_NISHI-MAGOME",
        "METRO_V1_HIKARIGAOKA",
        "METRO_V1_HONANCHO",
        "METRO_V1_MEGURO",
        "METRO_V1_MOTOYAWATA",
        "METRO_V1_YOYOGI-UEHARA",
        "METRO_V1_WAKOSHI",
    ] as const,

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
            minus: -2_500,
        },
        b: {
            value: "b" as StationGrade,
            price: 7_500,
            plus: 1_000,
            minus: -1_000,
        },
        c: {
            value: "c" as StationGrade,
            price: 5_000,
            plus: 500,
            minus: -500,
        },
    } as const,

    // TODO 物件駅の価格設定は暫定。ゲームバランスを見ながら調整する。
    /** 購入済み物件駅到着時の収益率 */
    REVENUE_RATE: 0.1,

    // TODO 到着ポイントの計算に使用する定数は暫定。ゲームバランスを見ながら調整する。
    /** 到着ポイントの計算に使用する定数 */
    ARRIVAL_PRIZE_V3: {
        /** 基本賞金(万円) */
        BASIC_PRIZE: 5_000,
        /** 駅数ごとの増加額(万円) */
        INCREMENT_PER_STATION_NUMBER: 1_000,
    } as const,

    // TODO 連続ゴールボーナスに使用する定数は暫定。ゲームバランスを見ながら調整する。
    /** 連続ゴールボーナスに使用する定数 */
    CONSECUTIVE_GOAL_BONUS_PER_STATION_NUMBER: 1_000,
} as const;

export type GameConstants = typeof GameConstants;
