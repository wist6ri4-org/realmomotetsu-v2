/**
 * Storybook用のデータfixture
 *
 * `__tests__/helpers/factories.ts`（Jestの単体試験用ファクトリ）を再利用しつつ、
 * 画面レベル試験（結合試験）でのみ必要となるリレーション付きの型（EventWithRelations /
 * UsersWithRelations）のビルダーと、APIレスポンスのJSON整形用ヘルパーを追加する。
 *
 * NOTE: 単体試験用のファクトリと二重管理にならないよう、基本のビルダーは
 *       `__tests__/helpers/factories.ts` からそのまま re-export している。
 */

import { Events, EventTypes, Role, Users } from "@/generated/prisma";
import { AttendancesWithRelations } from "@/repositories/attendances/AttendancesRepository";
import { EventWithRelations } from "@/repositories/events/EventsRepository";
import { UsersWithRelations } from "@/repositories/users/UsersRepository";
import {
    FIXED_DATE,
    TEST_EVENT_CODE,
    buildEvent,
    buildEventType,
    buildUser,
} from "../../../__tests__/helpers/factories";

export {
    FIXED_DATE,
    TEST_EVENT_CODE,
    TEST_EVENT_TYPE_CODE,
    buildAttendance,
    buildBidirectionalNearbyStations,
    buildBombiiHistory,
    buildDocument,
    buildEvent,
    buildEventType,
    buildGoalStation,
    buildLatestTransitStation,
    buildNearbyStation,
    buildPoints,
    buildPropertyPurchase,
    buildPropertyPurchaseWithRelations,
    buildStation,
    buildStations,
    buildTeam,
    buildTeamData,
    buildTransitStation,
    buildUser,
} from "../../../__tests__/helpers/factories";

/**
 * リレーション付きのイベント情報を生成する（`EventContext`の`event`に相当）
 * @param {Partial<Events>} overrides - イベントに上書きする項目
 * @param {Partial<EventTypes>} eventTypeOverrides - 紐づくイベント種別に上書きする項目
 * @return {EventWithRelations} リレーション付きのイベント情報
 */
export const buildEventWithRelations = (
    overrides: Partial<Events> = {},
    eventTypeOverrides: Partial<EventTypes> = {}
): EventWithRelations => {
    const event = buildEvent(overrides);
    return {
        ...event,
        eventType: buildEventType({ eventTypeCode: event.eventTypeCode, ...eventTypeOverrides }),
    };
};

/**
 * リレーション付きのユーザー情報を生成する（`EventContext`の`user`に相当）
 * @param {Partial<Users>} overrides - ユーザーに上書きする項目
 * @param {Partial<AttendancesWithRelations>[]} attendances - 紐づく参加情報（省略時は1イベント分の参加者ロールを自動生成）
 * @return {UsersWithRelations} リレーション付きのユーザー情報
 */
export const buildUsersWithRelations = (
    overrides: Partial<Users> = {},
    attendances?: Partial<AttendancesWithRelations>[]
): UsersWithRelations => {
    const user = buildUser(overrides);
    const resolvedAttendances: AttendancesWithRelations[] = (
        attendances ?? [{ teamCode: "TEAM_A", eventRole: Role.user }]
    ).map((attendanceOverrides, index) => {
        const eventCode = attendanceOverrides.eventCode ?? TEST_EVENT_CODE;
        return {
            id: index + 1,
            userId: user.id,
            eventCode,
            eventRole: Role.user,
            teamCode: "TEAM_A",
            createdAt: FIXED_DATE,
            updatedAt: FIXED_DATE,
            ...attendanceOverrides,
            event: buildEventWithRelations({ eventCode }),
        } as AttendancesWithRelations;
    });

    return {
        ...user,
        attendances: resolvedAttendances,
    };
};

/**
 * Prismaのモデルは`Date`型のフィールドを持つが、実際のAPIレスポンスはJSONシリアライズされ
 * ISO文字列になる。MSWハンドラーのレスポンスをより実態に近づけるための変換ヘルパー。
 * @param {T} value - 変換対象の値
 * @return {T} JSONシリアライズ・デシリアライズ後の値（Dateはstringになる）
 */
export const toJsonSafe = <T>(value: T): T => JSON.parse(JSON.stringify(value));
