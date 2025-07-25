import { AttendancesWithRelations } from "../attendances/AttendancesRepository";
import { BaseRepository } from "../base/BaseRepository";
import { Role, Users } from "@/generated/prisma";

export type UsersWithRelations = Users & {
    attendances: AttendancesWithRelations[];
};

export class UsersRepository extends BaseRepository {
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
