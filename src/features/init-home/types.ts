import { Teams } from "@/generated/prisma";
import { GoalStationsWithRelations } from "@/repositories/goalStations/GoalStationsRepository";
import { TeamData } from "@/types/TeamData";

/**
 * ホーム画面の初期化リクエスト
 * @property { string } eventCode - イベントコード
 */
export type InitHomeRequest = {
    eventCode: string;
};

/**
 * ホーム画面の初期化レスポンス
 * @property { TeamData[] } teamData - チームごとのデータ配列
 * @property { GoalStationsWithRelations | null } nextGoalStation - 次のゴール駅情報
 * @property { Teams | null } bombiiTeam - Bombiiチームの情報
 */
export type InitHomeResponse = {
    teamData: TeamData[];
    nextGoalStation: GoalStationsWithRelations | null;
    bombiiTeam: Teams | null;
};
