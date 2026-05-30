import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { ArrivalGoalStationV3Service } from "@/features/arrival-goal-station-v3/interface";
import { getArrivalGoalStationV3Service } from "../../../features/arrival-goal-station-v3/provider";
import {
    PostArrivalGoalStationV3RequestSchema,
    PostArrivalGoalStationV3ResponseSchema,
} from "@/features/arrival-goal-station-v3/validator";
import { PostArrivalGoalStationV3Response } from "@/features/arrival-goal-station-v3/types";

/**
 * 目的地到着処理に関するAPIハンドラー（V3）
 */
class ArrivalGoalStationV3ApiHandler extends BaseApiHandler {
    private readonly service: ArrivalGoalStationV3Service;

    /**
     * コンストラクタ
     * @param req - Next.jsのリクエストオブジェクト
     */
    constructor(req: NextRequest, service: ArrivalGoalStationV3Service = getArrivalGoalStationV3Service()) {
        super(req);
        this.service = service;
    }

    /**
     * HTTPメソッドごとのハンドラーを定義
     * @return {Handlers} - HTTPメソッドごとのハンドラーを定義したオブジェクト
     */
    protected getHandlers(): Handlers {
        return {
            POST: this.handlePost.bind(this),
        };
    }

    /**
     * POSTリクエストを処理するメソッド
     * @param req - Next.jsのリクエストオブジェクト
     * @return {Promise<NextResponse>} - レスポンスオブジェクト
     */
    private async handlePost(req: NextRequest): Promise<NextResponse> {
        this.logInfo("Handling POST request for arrival-goal-station-v3");

        try {
            // リクエストボディをJSONとしてパース
            const body = await req.json();

            // Zodでバリデーション
            const validatedBody = PostArrivalGoalStationV3RequestSchema.parse(body);

            const { stations, ...logBody } = validatedBody;
            this.logDebug("Request body", logBody);

            // サービスからデータを取得
            const data: PostArrivalGoalStationV3Response = await this.service.postArrivalGoalStationV3(validatedBody);

            // レスポンスのスキーマでバリデーション
            const validatedResponse: PostArrivalGoalStationV3Response =
                PostArrivalGoalStationV3ResponseSchema.parse(data);

            this.logInfo("Successfully processed arrival-goal-station-v3 data", {
                points: validatedResponse.points,
                hasPurchased: validatedResponse.propertyPurchases != null,
                purchasePoints: validatedResponse.purchasePoints,
            });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default ArrivalGoalStationV3ApiHandler;
