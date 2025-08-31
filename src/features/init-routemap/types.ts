import { GoalStations, Stations, Teams } from "@/generated/prisma";
import { TeamData } from "@/types/TeamData";

/**
 * 路線図の初期化リクエスト
 * @property { string } eventCode - イベントコード
 */
export type InitRoutemapRequest = {
    eventCode: string;
};

/**
 * 路線図の初期化レスポンス
 * @property { TeamData[] } teamData - チームごとのデータ配列
 * @property { GoalStations | null } nextGoalStation - 次のゴール駅情報
 * @property { Teams | null } bombiiTeam - Bombiiチームの情報
 * @property { Stations[] } stations - 駅情報の配列
 */
export type InitRoutemapResponse = {
    teamData: TeamData[];
    nextGoalStation: GoalStations | null;
    bombiiTeam: Teams | null;
    stations: Stations[];
};
