import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { CurrentLocationV3ServiceImpl } from "@/features/current-location-v3/service";
import {
    PostCurrentLocationV3RequestSchema,
    PostCurrentLocationV3ResponseSchema,
} from "@/features/current-location-v3/validator";
import { PostCurrentLocationV3Response } from "@/features/current-location-v3/types";

/**
 * 現在地登録に関するAPIハンドラー（V3）
 */
class CurrentLocationV3ApiHandler extends BaseApiHandler {
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
        this.logInfo("Handling POST request for current-location-v3");

        try {
            // リクエストボディをJSONとしてパース
            const body = await req.json();

            // Zodでバリデーション
            const validatedBody = PostCurrentLocationV3RequestSchema.parse(body);

            this.logDebug("Request body", validatedBody);

            // サービスからデータを取得
            const data: PostCurrentLocationV3Response = await CurrentLocationV3ServiceImpl.postCurrentLocationV3(
                validatedBody
            );

            // レスポンスのスキーマでバリデーション
            const validatedResponse: PostCurrentLocationV3Response = PostCurrentLocationV3ResponseSchema.parse(data);

            this.logInfo("Successfully processed current-location-v3 data", {
                teamCode: validatedResponse.transitStation.teamCode,
                stationCode: validatedResponse.transitStation.stationCode,
            });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default CurrentLocationV3ApiHandler;
