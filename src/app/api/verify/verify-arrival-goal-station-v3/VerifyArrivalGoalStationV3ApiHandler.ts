import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { VerifyArrivalGoalStationV3Service } from "@/features/verify/verify-arrival-goal-station-v3/interface";
import { getVerifyArrivalGoalStationV3Service } from "@/features/verify/verify-arrival-goal-station-v3/provider";
import {
    PostVerifyArrivalGoalStationV3RequestSchema,
    PostVerifyArrivalGoalStationV3ResponseSchema,
} from "@/features/verify/verify-arrival-goal-station-v3/validator";
import { PostVerifyArrivalGoalStationV3Response } from "@/features/verify/verify-arrival-goal-station-v3/types";

/**
 * 目的地到着処理に関するAPIハンドラー（V3）
 */
class VerifyArrivalGoalStationV3ApiHandler extends BaseApiHandler {
    private readonly service: VerifyArrivalGoalStationV3Service;

    /**
     * コンストラクタ
     * @param req - Next.jsのリクエストオブジェクト
     */
    constructor(req: NextRequest, service: VerifyArrivalGoalStationV3Service = getVerifyArrivalGoalStationV3Service()) {
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
        this.logInfo("Handling POST request for verify-arrival-goal-station-v3");

        try {
            // リクエストボディをJSONとしてパース
            const body = await req.json();

            // Zodでバリデーション
            const validatedBody = PostVerifyArrivalGoalStationV3RequestSchema.parse(body);

            this.logDebug("Request body", validatedBody);

            // サービスからデータを取得
            const data: PostVerifyArrivalGoalStationV3Response =
                await this.service.postVerifyArrivalGoalStationV3(validatedBody);

            // レスポンスのスキーマでバリデーション
            const validatedResponse: PostVerifyArrivalGoalStationV3Response =
                PostVerifyArrivalGoalStationV3ResponseSchema.parse(data);

            this.logInfo("Successfully processed verify-arrival-goal-station-v3 data", {
                result: validatedResponse.result,
            });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default VerifyArrivalGoalStationV3ApiHandler;
