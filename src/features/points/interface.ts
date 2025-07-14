import { PointsGroupedByTeamCode } from "@/types/PointsGroupedByTeamCode";
import { GetPointsRequest, PostPointsRequest } from "./types";
import { Points } from "@/generated/prisma";

export interface PointsService {
    /**
     * イベントコードに紐づくポイントをチームコードごとに取得する
     * @param req - リクエストデータ
     * @return {Promise<PointsGroupedByTeamCode>} チームコードごとにグループ化されたポイント
     */
    getPointsByEventCodeGroupedByTeamCode: (
        req: GetPointsRequest
    ) => Promise<PointsGroupedByTeamCode>;

    /**
     * ポイントを登録する
     * @param req - リクエストデータ
     * @return {Promise<void>} 登録完了
     */
    postPoints: (req: PostPointsRequest) => Promise<Points>;
}
