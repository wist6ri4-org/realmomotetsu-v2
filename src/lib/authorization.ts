import { Events, OperationLevel, Role, VisibilityLevel } from "@/generated/prisma";
import { AttendancesWithRelations } from "@/repositories/attendances/AttendancesRepository";
import { UsersWithRelations } from "@/repositories/users/UsersRepository";

/**
 * 認可判定の純粋関数群。
 *
 * `src/lib/auth.ts` は Supabase クライアント（ブラウザ用）を import しているため、
 * サーバー側（API ハンドラー／サービス層）から安全に使えるようここへ切り出している。
 * `src/lib/auth.ts` からは互換のため再エクスポートしている。
 *
 * 権限は 3 軸で決まる。
 * - `Users.masterRole`: 恒久的なロール（全イベント横断）
 * - `Attendances.eventRole`: イベントごとの一時的なロール
 * - `Events.visibilityLevel` / `Events.operationLevel`: イベント側の公開・操作レベル
 */

/**
 * 管理者ユーザーかどうかを確認（UsersWithRelations使用）
 * @param {UsersWithRelations} user - ユーザーオブジェクト
 * @param {string} eventCode - イベントコード
 * @return {boolean} - 管理者ユーザーであればtrue、そうでなければfalse
 */
export const checkIsAdminUserWithUsers = (user: UsersWithRelations, eventCode: string): boolean => {
    const attendance = user.attendances?.find((att) => att.eventCode === eventCode);

    if (user.masterRole !== Role.admin && attendance?.eventRole !== Role.admin) {
        return false;
    }

    return true;
};

/**
 * 操作権限があるか確認
 * @param {UsersWithRelations} user - ユーザー
 * @param {Events} event - イベント
 * @return {boolean} - 操作権限があればtrue、なければfalse
 */
export const checkIsOperatingUser = (user: UsersWithRelations, event: Events): boolean => {
    const attendance = user.attendances?.find((att) => att.eventCode === event.eventCode);
    if (user.masterRole === Role.admin) {
        return new Set<OperationLevel>([
            OperationLevel.admin,
            OperationLevel.organizer,
            OperationLevel.participant,
        ]).has(event.operationLevel);
    } else if (attendance?.eventRole === Role.admin) {
        return new Set<OperationLevel>([OperationLevel.organizer, OperationLevel.participant]).has(
            event.operationLevel
        );
    } else {
        return new Set<OperationLevel>([OperationLevel.participant]).has(event.operationLevel);
    }
};

/**
 * 閲覧権限があるか確認
 * @param {UsersWithRelations} user - ユーザー
 * @param {AttendancesWithRelations} attendance - 参加情報（関連するイベント情報を含む）
 * @return {boolean} - 閲覧権限があればtrue、なければfalse
 */
export const checkIsVisibleUser = (user: UsersWithRelations, attendance: AttendancesWithRelations): boolean => {
    if (user.masterRole === Role.admin) {
        return new Set<VisibilityLevel>([
            VisibilityLevel.admin,
            VisibilityLevel.organizer,
            VisibilityLevel.participant,
        ]).has(attendance.event.visibilityLevel);
    } else if (attendance.eventRole === Role.admin) {
        return new Set<VisibilityLevel>([VisibilityLevel.organizer, VisibilityLevel.participant]).has(
            attendance.event.visibilityLevel
        );
    } else {
        return new Set<VisibilityLevel>([VisibilityLevel.participant]).has(attendance.event.visibilityLevel);
    }
};

/**
 * イベントの閲覧権限があるか確認（Events を直接受け取る版）
 *
 * `checkIsVisibleUser` は AttendancesWithRelations を要求するため、
 * `Events` しか手元に無いサーバー側から使えるようにした同等の判定。
 * 参加情報が無いユーザーは、master 管理者でなければ閲覧不可とする。
 *
 * @param {UsersWithRelations} user - ユーザー
 * @param {Events} event - イベント
 * @return {boolean} - 閲覧権限があればtrue、なければfalse
 */
export const checkIsVisibleUserForEvent = (user: UsersWithRelations, event: Events): boolean => {
    if (user.masterRole === Role.admin) {
        return new Set<VisibilityLevel>([
            VisibilityLevel.admin,
            VisibilityLevel.organizer,
            VisibilityLevel.participant,
        ]).has(event.visibilityLevel);
    }

    const attendance = user.attendances?.find((att) => att.eventCode === event.eventCode);
    if (!attendance) {
        return false;
    }

    if (attendance.eventRole === Role.admin) {
        return new Set<VisibilityLevel>([VisibilityLevel.organizer, VisibilityLevel.participant]).has(
            event.visibilityLevel
        );
    }

    return new Set<VisibilityLevel>([VisibilityLevel.participant]).has(event.visibilityLevel);
};
