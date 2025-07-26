import { AttendancesWithRelations } from "../attendances/AttendancesRepository";
import { BaseRepository } from "../base/BaseRepository";
import { Role, Users } from "@/generated/prisma";

// includeありのUsersの型定義
export type UsersWithRelations = Users & {
    attendances: AttendancesWithRelations[];
};

/**
 * ユーザー関連のデータアクセス処理を担当するRepository
 */
export class UsersRepository extends BaseRepository {
    /**
     * 指定されたIDのユーザーを取得
     * @param {string} uuid - ユーザーのUUID
     * @returns {Promise<UsersWithRelations | null>} ユーザー情報またはnull
     */
    async findByUuid(uuid: string): Promise<UsersWithRelations | null> {
        try {
            return await this.prisma.users.findUnique({
                where: { uuid },
                include: {
                    attendances: {
                        include: {
                            event: true,
                        },
                    },
                },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findByUuid");
        }
    }

    /**
     * ユーザーを登録する
     * @param {Object} userData - ユーザー情報
     * @param {string} userData.uuid - ユーザーのUUID
     * @param {string} userData.email - ユーザーのメールアドレス
     * @param {string} [userData.nickname] - ユーザーのニックネーム
     * @param {string} [userData.iconUrl] - ユーザーのアイコンURL
     * @param {Role} [userData.role] - ユーザーのロール
     * @return {Promise<Users>} 登録されたユーザー情報
     */
    async create(userData: {
        uuid: string;
        email: string;
        nickname?: string;
        iconUrl?: string;
        role?: Role;
    }): Promise<Users> {
        try {
            return await this.prisma.users.create({
                data: userData,
            });
        } catch (error) {
            this.handleDatabaseError(error, "create");
        }
    }
}
