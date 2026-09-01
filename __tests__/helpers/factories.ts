/**
 * テスト用のデータファクトリ
 *
 * Prismaのモデルは必須カラムが多く、テストごとに全項目を書くと本質的な条件が埋もれる。
 * ここで既定値を持つファクトリを提供し、各テストでは検証に関係する項目だけをoverrideする。
 */

import {
    Events,
    GoalStations,
    LatestTransitStations,
    NearbyStations,
    Points,
    PointStatus,
    PropertyPurchases,
    Stations,
    StationGrade,
    StationType,
    Teams,
    TransitStations,
} from "@/generated/prisma";
import { GoalStationsWithRelations } from "@/repositories/goalStations/GoalStationsRepository";
import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";
import { PropertyPurchasesWithRelations } from "@/repositories/propertyPurchases/PropertyPurchasesRepository";
import { TeamData } from "@/types/TeamData";

/** 全ファクトリで共通に使う固定日時（createdAt/updatedAtの差分でテストが揺れないようにする） */
export const FIXED_DATE = new Date("2026-01-01T00:00:00.000Z");

/** テストで使う共通のイベント種別コード */
export const TEST_EVENT_TYPE_CODE = "TEST_V1";

/** テストで使う共通のイベントコード */
export const TEST_EVENT_CODE = "TEST_EVENT";

/**
 * イベントを生成する
 * @param {Partial<Events>} overrides - 上書きする項目
 * @return {Events} イベント
 */
export const buildEvent = (overrides: Partial<Events> = {}): Events => ({
    id: 1,
    eventCode: TEST_EVENT_CODE,
    eventTypeCode: TEST_EVENT_TYPE_CODE,
    eventName: "テストイベント",
    startDate: FIXED_DATE,
    visibilityLevel: "participant",
    operationLevel: "participant",
    discordWebhookUrl: "https://discord.com/api/webhooks/sample",
    isNotificationEnabled: false,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
});

/**
 * 駅を生成する
 * @param {Partial<Stations>} overrides - 上書きする項目
 * @return {Stations} 駅
 */
export const buildStation = (overrides: Partial<Stations> = {}): Stations => ({
    id: 1,
    stationCode: "STATION_A",
    name: "駅A",
    kana: "えきえー",
    englishName: "Station A",
    latitude: 35.0,
    longitude: 139.0,
    isMissionSet: false,
    stationType: StationType.mission,
    stationGrade: StationGrade.none,
    eventTypeCode: TEST_EVENT_TYPE_CODE,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
});

/**
 * 駅コードの配列から駅の配列を生成する
 * @param {string[]} stationCodes - 駅コードの配列
 * @param {Partial<Stations>} overrides - 全駅に共通で上書きする項目
 * @return {Stations[]} 駅の配列
 */
export const buildStations = (stationCodes: string[], overrides: Partial<Stations> = {}): Stations[] =>
    stationCodes.map((stationCode, index) =>
        buildStation({
            id: index + 1,
            stationCode,
            name: stationCode,
            ...overrides,
        }),
    );

/**
 * 近隣駅（リレーション付き）を生成する
 * @param {string} fromStationCode - 出発駅のコード
 * @param {string} toStationCode - 到着駅のコード
 * @param {number} timeMinutes - 所要時間（分）
 * @param {Partial<NearbyStations>} overrides - 上書きする項目
 * @return {NearbyStationsWithRelations} 近隣駅
 */
export const buildNearbyStation = (
    fromStationCode: string,
    toStationCode: string,
    timeMinutes: number,
    overrides: Partial<NearbyStations> = {},
): NearbyStationsWithRelations => ({
    id: 1,
    eventTypeCode: TEST_EVENT_TYPE_CODE,
    fromStationCode,
    toStationCode,
    timeMinutes,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
    fromStation: buildStation({ stationCode: fromStationCode, name: fromStationCode }),
    toStation: buildStation({ stationCode: toStationCode, name: toStationCode }),
});

/**
 * 双方向の近隣駅を生成する
 * @description 実データの近隣駅は上り・下りの2レコードで登録されるため、テストでもそれに合わせる
 * @param {Array<[string, string, number]>} edges - [出発駅コード, 到着駅コード, 所要時間]の配列
 * @return {NearbyStationsWithRelations[]} 双方向に展開した近隣駅の配列
 */
export const buildBidirectionalNearbyStations = (
    edges: Array<[string, string, number]>,
): NearbyStationsWithRelations[] =>
    edges.flatMap(([from, to, timeMinutes], index) => [
        buildNearbyStation(from, to, timeMinutes, { id: index * 2 + 1 }),
        buildNearbyStation(to, from, timeMinutes, { id: index * 2 + 2 }),
    ]);

/**
 * チームを生成する
 * @param {Partial<Teams>} overrides - 上書きする項目
 * @return {Teams} チーム
 */
export const buildTeam = (overrides: Partial<Teams> = {}): Teams => ({
    id: 1,
    teamCode: "TEAM_A",
    teamName: "チームA",
    teamColor: "#ff0000",
    eventCode: TEST_EVENT_CODE,
    discordWebhookUrl: null,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
});

/**
 * 目的駅（リレーション付き）を生成する
 * @param {Partial<GoalStations>} overrides - 上書きする項目
 * @param {Partial<Stations>} stationOverrides - 紐づく駅に上書きする項目
 * @return {GoalStationsWithRelations} 目的駅
 */
export const buildGoalStation = (
    overrides: Partial<GoalStations> = {},
    stationOverrides: Partial<Stations> = {},
): GoalStationsWithRelations => {
    const stationCode = overrides.stationCode ?? "STATION_A";
    return {
        id: 1,
        eventCode: TEST_EVENT_CODE,
        stationCode,
        createdAt: FIXED_DATE,
        updatedAt: FIXED_DATE,
        ...overrides,
        station: buildStation({ stationCode, name: stationCode, ...stationOverrides }),
    };
};

/**
 * 経由駅を生成する
 * @param {Partial<TransitStations>} overrides - 上書きする項目
 * @return {TransitStations} 経由駅
 */
export const buildTransitStation = (overrides: Partial<TransitStations> = {}): TransitStations => ({
    id: 1,
    stationCode: "STATION_A",
    teamCode: "TEAM_A",
    eventCode: TEST_EVENT_CODE,
    isGoal: false,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
});

/**
 * 最新の経由駅（ビュー）を生成する
 * @param {Partial<LatestTransitStations>} overrides - 上書きする項目
 * @return {LatestTransitStations} 最新の経由駅
 */
export const buildLatestTransitStation = (
    overrides: Partial<LatestTransitStations> = {},
): LatestTransitStations => ({
    id: 1,
    teamCode: "TEAM_A",
    stationCode: "STATION_A",
    eventCode: TEST_EVENT_CODE,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
});

/**
 * ポイントを生成する
 * @param {Partial<Points>} overrides - 上書きする項目
 * @return {Points} ポイント
 */
export const buildPoints = (overrides: Partial<Points> = {}): Points => ({
    id: 1,
    teamCode: "TEAM_A",
    eventCode: TEST_EVENT_CODE,
    points: 0,
    status: PointStatus.scored,
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
});

/**
 * 物件駅購入情報を生成する
 * @param {Partial<PropertyPurchases>} overrides - 上書きする項目
 * @return {PropertyPurchases} 物件駅購入情報
 */
export const buildPropertyPurchase = (overrides: Partial<PropertyPurchases> = {}): PropertyPurchases => ({
    id: 1,
    eventCode: TEST_EVENT_CODE,
    teamCode: "TEAM_A",
    stationCode: "STATION_A",
    createdAt: FIXED_DATE,
    updatedAt: FIXED_DATE,
    ...overrides,
});

/**
 * 物件駅購入情報（リレーション付き）を生成する
 * @param {Partial<PropertyPurchases>} overrides - 上書きする項目
 * @param {object} relationOverrides - リレーションに上書きする項目
 * @param {Partial<Stations>} relationOverrides.station - 紐づく駅に上書きする項目
 * @param {Partial<Teams>} relationOverrides.team - 紐づくチームに上書きする項目
 * @return {PropertyPurchasesWithRelations} 物件駅購入情報
 */
export const buildPropertyPurchaseWithRelations = (
    overrides: Partial<PropertyPurchases> = {},
    relationOverrides: { station?: Partial<Stations>; team?: Partial<Teams> } = {},
): PropertyPurchasesWithRelations => {
    const base = buildPropertyPurchase(overrides);
    return {
        ...base,
        event: buildEvent({ eventCode: base.eventCode }),
        team: buildTeam({ teamCode: base.teamCode, ...relationOverrides.team }),
        station: buildStation({
            stationCode: base.stationCode,
            name: base.stationCode,
            ...relationOverrides.station,
        }),
    };
};

/**
 * チームデータを生成する
 * @param {Partial<TeamData>} overrides - 上書きする項目
 * @return {TeamData} チームデータ
 */
export const buildTeamData = (overrides: Partial<TeamData> = {}): TeamData => ({
    id: 1,
    teamCode: "TEAM_A",
    teamName: "チームA",
    teamColor: "#ff0000",
    transitStations: [],
    remainingStationsNumber: 0,
    points: 0,
    scoredPoints: 0,
    propertyPurchasePoints: 0,
    revenuePoints: 0,
    bombiiCounts: 0,
    ...overrides,
});
