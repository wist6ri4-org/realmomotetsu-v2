import {
    TeamsSchema,
    StationsSchema,
    NearbyStationsSchema,
    DocumentsSchema,
    UsersSchema,
    AttendancesSchema,
    EventsSchema,
    EventTypesSchema,
    GoalStationsSchema,
    TransitStationsSchema,
    BombiiHistoriesSchema,
} from "@/generated/zod";
import { z } from "zod";

// 初期化データのリクエストスキーマ
export const InitRequestSchema = z.object({
    eventCode: z.string().min(1, "Event code is required"),
    uuid: z.string().min(1, "UUID is required"),
});

// 初期化データのレスポンススキーマ
export const InitResponseSchema = z.object({
    teams: z.array(TeamsSchema),
    stations: z.array(StationsSchema),
    nearbyStations: z.array(
        NearbyStationsSchema.extend({
            fromStation: StationsSchema,
            toStation: StationsSchema,
        })
    ),
    documents: z.array(DocumentsSchema),
    user: UsersSchema.extend({
        attendances: z.array(AttendancesSchema.extend({ event: EventsSchema })),
    }),
    event: EventsSchema.extend({
        eventType: EventTypesSchema,
        teams: z.array(TeamsSchema).optional(),
        goalStations: z.array(GoalStationsSchema.extend({ station: StationsSchema })).optional(),
        transitStations: z.array(TransitStationsSchema.extend({ station: StationsSchema })).optional(),
        bombiiHistories: z.array(BombiiHistoriesSchema.extend({ team: TeamsSchema })).optional(),
    }),
});
