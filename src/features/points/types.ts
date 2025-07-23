import { PointStatus } from "@/generated/prisma";
import { PointsGroupedByTeamCode } from "@/types/PointsGroupedByTeamCode";

/**
 * ポイントの取得リクエスト
 * @param eventCode - イベントコード
 */
export type GetPointsRequest = {
    eventCode: string;
};

/**
 * ポイントの取得レスポンス
 */
export type GetPointsResponse = PointsGroupedByTeamCode;

/**
 * ポイントの登録リクエスト
 * @param eventCode - イベントコード
 * @param teamCode - チームコード
 * @param points - ポイント数
 * @param status - ポイントのステータス
 */
export type PostPointsRequest = {
    eventCode: string;
    teamCode: string;
    points: number;
    status: PointStatus;
};

/**
 * ポイントの更新リクエスト
 * @param teamCode - チームコード
 */
export type PutPointsRequest = {
    teamCode: string;
}