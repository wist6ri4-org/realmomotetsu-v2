import { Events, Role } from "@/generated/prisma";
import { checkIsOperatingUser, checkIsVisibleUserForEvent } from "@/lib/authorization";
import supabase from "@/lib/supabase";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { UsersWithRelations } from "@/repositories/users/UsersRepository";
import { ForbiddenError, UnauthorizedError } from "@/error/apiError";
import { NextRequest } from "next/server";

/**
 * API の認証・認可の共通処理。
 *
 * セッションは localStorage 保持（@supabase/ssr 未導入）でサーバーは Cookie から
 * JWT を取得できないため、クライアントは `Authorization: Bearer <access_token>` を
 * 送る必要がある。送信側は `src/lib/apiClient.ts` に集約している。
 */

/** イベントに対するアクセス種別 */
export type EventAccessMode = "view" | "operate";

/** Bearer トークンの接頭辞 */
const BEARER_PREFIX = "Bearer ";

/**
 * リクエストの Authorization ヘッダーを検証し、対応するアプリユーザーを取得する。
 *
 * @param {NextRequest} req - リクエスト
 * @return {Promise<UsersWithRelations>} 認証済みユーザー（参加情報を含む）
 * @throws {UnauthorizedError} トークンが無い・不正・対応する users レコードが無い場合
 */
export const resolveAuthUser = async (req: NextRequest): Promise<UsersWithRelations> => {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith(BEARER_PREFIX)) {
        throw new UnauthorizedError({
            message: "認証が必要です",
            errorCode: "AUTH_TOKEN_MISSING",
        });
    }

    const token = authHeader.slice(BEARER_PREFIX.length).trim();
    if (!token) {
        throw new UnauthorizedError({
            message: "認証が必要です",
            errorCode: "AUTH_TOKEN_MISSING",
        });
    }

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
        throw new UnauthorizedError({
            message: "認証に失敗しました",
            errorCode: "AUTH_TOKEN_INVALID",
        });
    }

    try {
        // findByUuid は attendances を event.startDate が設定済みのものに絞り込む。
        // クライアント側の判定（/api/users/[uuid] 経由）と同じ結果になるよう、あえて共用している。
        return await RepositoryFactory.getUsersRepository().findByUuid(user.id);
    } catch {
        // JWT 自体は Supabase Auth で検証済みなので、ここに来るのは public.users に
        // レコードが無い（サインアップが途中で失敗した）ケースが実質的に唯一。
        throw new UnauthorizedError({
            message: "ユーザープロファイルが見つかりません",
            errorCode: "USER_PROFILE_NOT_FOUND",
        });
    }
};

/**
 * 認証済みユーザーが指定イベントにアクセスできるか検証する。
 *
 * 注意: `checkIsOperatingUser` は「参加情報が無いユーザー」も else 分岐に落ちるため、
 * operationLevel が participant のイベントに対して単体では true を返してしまう。
 * クライアント側では自分の参加情報経由でしか画面に到達しないため問題にならなかったが、
 * サーバー側では任意の eventCode を指定できるので、先に参加者であることを要求する。
 *
 * @param {UsersWithRelations} user - 認証済みユーザー
 * @param {string} eventCode - イベントコード
 * @param {EventAccessMode} mode - "view" は閲覧、"operate" は書き込み・操作
 * @return {Promise<Events>} 対象イベント
 * @throws {ForbiddenError} 権限が無い場合
 */
export const assertEventAccess = async (
    user: UsersWithRelations,
    eventCode: string,
    mode: EventAccessMode
): Promise<Events> => {
    const event = await RepositoryFactory.getEventsRepository().findByEventCode(eventCode);

    const isMasterAdmin = user.masterRole === Role.admin;
    const isAttendee = user.attendances?.some((att) => att.eventCode === eventCode) ?? false;

    if (!isMasterAdmin && !isAttendee) {
        throw new ForbiddenError({
            message: "このイベントへのアクセス権限がありません",
            errorCode: "EVENT_ACCESS_DENIED",
        });
    }

    const isAllowed = mode === "operate" ? checkIsOperatingUser(user, event) : checkIsVisibleUserForEvent(user, event);

    if (!isAllowed) {
        throw new ForbiddenError({
            message:
                mode === "operate"
                    ? "このイベントを操作する権限がありません"
                    : "このイベントを閲覧する権限がありません",
            errorCode: mode === "operate" ? "EVENT_OPERATION_DENIED" : "EVENT_VISIBILITY_DENIED",
        });
    }

    return event;
};

/**
 * 対象ユーザーのプロファイルを操作できるか検証する。
 * 本人、または master 管理者のみ許可する。
 *
 * @param {UsersWithRelations} user - 認証済みユーザー
 * @param {string} targetUuid - 操作対象ユーザーの UUID
 * @throws {ForbiddenError} 権限が無い場合
 */
export const assertSelfOrMasterAdmin = (user: UsersWithRelations, targetUuid: string): void => {
    if (user.uuid === targetUuid || user.masterRole === Role.admin) {
        return;
    }

    throw new ForbiddenError({
        message: "他のユーザーのプロファイルは操作できません",
        errorCode: "USER_PROFILE_ACCESS_DENIED",
    });
};
