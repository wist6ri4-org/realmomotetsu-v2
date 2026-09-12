import { GoalStations, Teams } from "@/generated/prisma";
import { PropertyPurchasesForRoutemap } from "@/repositories/propertyPurchases/PropertyPurchasesRepository";
import { TeamData } from "@/types/TeamData";

/**
 * 路線図の初期化リクエスト
 * @property { string } eventCode - イベントコード
 */
export type InitRoutemapRequest = {
    eventCode: string;
};

export type TeamDataForRoutemap = Omit<
    TeamData,
    "points" | "scoredPoints" | "propertyPurchasePoints" | "revenuePoints"
>;

/**
 * 路線図の初期化レスポンス
 * @property { TeamData[] } teamData - チームごとのデータ配列
 * @property { GoalStations | null } nextGoalStation - 次のゴール駅情報
 * @property { Teams | null } bombiiTeam - Bombiiチームの情報
 * @property { PropertyPurchasesForRoutemap[] } propertyPurchases - 物件駅購入情報の配列
 */
export type InitRoutemapResponse = {
    teamData: TeamDataForRoutemap[];
    nextGoalStation: GoalStations | null;
    bombiiTeam: Teams | null;
    propertyPurchases: PropertyPurchasesForRoutemap[];
};
