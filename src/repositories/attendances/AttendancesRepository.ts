import { Attendances, Events } from "@/generated/prisma";
import { BaseRepository } from "../base/BaseRepository";

export type AttendancesWithRelations = Attendances & {
    event: Events;
}

export class AttendancesRepository extends BaseRepository {

}