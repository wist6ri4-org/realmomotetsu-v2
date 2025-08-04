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
     * @returns {Promise<UsersWithRelations>} ユーザー情報
     */
    async findByUuid(uuid: string): Promise<UsersWithRelations> {
        try {
            return await this.prisma.users.findUniqueOrThrow({
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

    /**
     * ユーザーをUUIDで更新する
     * @param {string} uuid - ユーザーのUUID
     * @param {Object} updateData - 更新するデータ
     * @param {string} [updateData.email] - ユーザーのメールアドレス
     * @param {string} [updateData.nickname] - ユーザーのニックネーム
     * @param {string} [updateData.iconUrl] - ユーザーのアイコンURL
     * @return {Promise<UsersWithRelations>} 更新されたユーザー情報
     */
    async updateByUuid(
        uuid: string,
        updateData: {
            email?: string;
            nickname?: string;
            iconUrl?: string;
        }
    ): Promise<UsersWithRelations> {
        try {
            await this.prisma.users.update({
                where: { uuid },
                data: updateData,
            });

            // 更新後のユーザー情報を関連データと一緒に取得
            return await this.findByUuid(uuid);
        } catch (error) {
            this.handleDatabaseError(error, "updateByUuid");
        }
    }
}
