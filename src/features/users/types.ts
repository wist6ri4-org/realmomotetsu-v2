import { Role } from "@/generated/prisma";
/**
 * ユーザーの登録リクエスト
 * @param eventCode - イベントコード
 * @param teamCode - チームコード
 * @param users - ユーザー数
 * @param status - ユーザーのステータス
 */
export type PostUsersRequest = {
    uuid: string;
    email: string
    nickname? :string;
    role?: Role;
}
