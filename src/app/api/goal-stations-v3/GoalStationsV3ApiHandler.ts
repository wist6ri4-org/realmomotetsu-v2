import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { assertEventAccess } from "@/app/api/utils/auth";
import { Handlers } from "@/app/api/utils/types";
import { GoalStationsServiceV3Impl } from "@/features/goal-stations-v3/service";
import {
    PostGoalStationsV3RequestSchema,
    PostGoalStationsV3ResponseSchema,
} from "@/features/goal-stations-v3/validator";
import { PostGoalStationsV3Response } from "@/features/goal-stations-v3/types";

/**
 * 目的駅に関するAPIハンドラー（v3）
 */
class GoalStationsV3ApiHandler extends BaseApiHandler {
    /**
     * コンストラクタ
     * @param req - Next.jsのリクエストオブジェクト
     */
    constructor(req: NextRequest) {
        super(req);
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
        this.logInfo("Handling POST request for goal-stations-v3");

        try {
            // リクエストボディをJSONとしてパース
            const body = await req.json();

            // Zodでバリデーション
            const validatedBody = PostGoalStationsV3RequestSchema.parse(body);

            await assertEventAccess(this.getAuthUser(), validatedBody.eventCode, "operate");

            this.logDebug("Request body", validatedBody);

            // サービスからデータを取得
            const data: PostGoalStationsV3Response = await GoalStationsServiceV3Impl.postGoalStationsV3(validatedBody);

            // レスポンスのスキーマでバリデーション
            const validatedResponse: PostGoalStationsV3Response = PostGoalStationsV3ResponseSchema.parse(data);

            this.logInfo("Successfully processed goal-stations-v3 data", {
                eventCode: validatedResponse.goalStation.eventCode,
                stationCode: validatedResponse.goalStation.stationCode,
            });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default GoalStationsV3ApiHandler;
