import { GoalStations, Teams } from "@/generated/prisma";
import { TeamData } from "@/types/TeamData";

/**
 * ホーム画面の初期化リクエスト
 * @param eventCode - イベントコード
 */
export type InitHomeRequest = {
    eventCode: string;
};

/**
 * ホーム画面の初期化レスポンス
 * @param teamData - チームデータの配列
 * @param nextGoalStation - 次の目的駅（nullの場合もあり）
 * @param bombiiTeam - ボンビーを持っているチーム（nullの場合もあり）
 */
export type InitHomeResponse = {
    teamData: TeamData[];
    nextGoalStation: GoalStations | null;
    bombiiTeam: Teams | null;
};
