import { Stations, Teams } from "@/generated/prisma";

export type InitFormRequest = {
    eventCode: string;
    longitude?: number;
    latitude?: number;
};

export type InitFormResponse = {
    teams: Teams[];
    stations: Stations[];
    nearbyStations?: Array<{
        stationCode: string;
        distance: number;
    }>;
};
