import { Points, PointStatus } from "@/generated/prisma";

/**
 * ポイント移動の登録リクエスト
 * @property { string } eventCode - イベントコード
 * @property { string } fromTeamCode - 移動元チームコード
 * @property { string } toTeamCode - 移動先チームコード
 * @property { number } points - ポイント数
 * @property { PointStatus } status - ポイントのステータス
 */
export type PostBulkPointsRequest = {
    eventCode: string;
    fromTeamCode: string;
    toTeamCode: string;
    points: number;
    status: PointStatus;
};

/**
 * ポイント移動の登録レスポンス
 * @property { Points } fromPoint - 移動元に登録されたポイント情報
 * @property { Points } toPoint - 移動先に登録されたポイント情報
 */
export type PostBulkPointsResponse = {
    fromPoint: Points;
    toPoint: Points;
};
