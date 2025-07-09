import { GoalStations, Teams } from "@/generated/prisma";
import { TeamData } from "@/types/TeamData";

export type InitHomeRequest = {
    eventCode: string;
};

export type InitHomeResponse = {
    teamData: TeamData[];
    nextGoalStation: GoalStations | null;
    bombiiTeam: Teams | null;
};
