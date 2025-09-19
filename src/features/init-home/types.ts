import { GoalStations, Teams } from "@/generated/prisma";
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
 * @property { GoalStations | null } nextGoalStation - 次のゴール駅情報
 * @property { Teams | null } bombiiTeam - Bombiiチームの情報
 */
export type InitHomeResponse = {
    teamData: TeamData[];
    nextGoalStation: GoalStations | null;
    bombiiTeam: Teams | null;
};
