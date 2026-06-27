import { Attendances, Events, EventTypes } from "@/generated/prisma";
import { BaseRepository } from "../base/BaseRepository";

export type AttendancesWithRelations = Attendances & {
    event: Events & {
        eventType: EventTypes;
    };
}

export class AttendancesRepository extends BaseRepository {

}