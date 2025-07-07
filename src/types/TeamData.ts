import { TransitStations } from "@/generated/prisma/client";

export type TeamData = {
    id: number;
    teamCode: string;
    teamName: string;
    teamColor: string;
    transitStations: TransitStations[];
    remainingStationsNumber: number;
    chargedPoints: number;
    notChargedPoints: number;
};
