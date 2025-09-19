import { Points, PointStatus } from "@/generated/prisma";
import { PointsGroupedByTeamCode } from "@/types/PointsGroupedByTeamCode";

/**
 * ポイントの取得リクエスト
 * @property { string } eventCode - イベントコード
 */
export type GetPointsRequest = {
    eventCode: string;
};

/**
 * ポイントの取得レスポンス
 * @property { PointsGroupedByTeamCode } points - チームコードごとにグループ化されたポイント情報
 */
export type GetPointsResponse = {
    points: PointsGroupedByTeamCode;
};

/**
 * ポイントの登録リクエスト
 * @property { string } eventCode - イベントコード
 * @property { string } teamCode - チームコード
 * @property { number } points - ポイント数
 * @property { PointStatus } status - ポイントのステータス
 */
export type PostPointsRequest = {
    eventCode: string;
    teamCode: string;
    points: number;
    status: PointStatus;
};

/**
 * ポイントの登録レスポンス
 * @property { Points } points - 登録されたポイント情報
 */
export type PostPointsResponse = {
    point: Points;
};

/**
 * ポイントの更新リクエスト
 * @property { string } teamCode - チームコード
 */
export type PutPointsRequest = {
    teamCode: string;
};

/**
 * ポイントの更新レスポンス
 * @property { number } count - 更新されたポイントの数
 */
export type PutPointsResponse = {
    count: number;
};
