import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { CurrentLocationServiceImpl } from "@/features/current-location/service";
import {
    PostCurrentLocationRequestSchema,
    PostCurrentLocationResponseSchema,
} from "@/features/current-location/validator";
import { PostCurrentLocationResponse } from "@/features/current-location/types";

/**
 * 現在地とポイント登録に関するAPIハンドラー
 */
class CurrentLocationApiHandler extends BaseApiHandler {
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
        this.logInfo("Handling POST request for current-location");

        try {
            // リクエストボディをJSONとしてパース
            const body = await req.json();

            // Zodでバリデーション
            const validatedBody = PostCurrentLocationRequestSchema.parse(body);

            this.logDebug("Request body", validatedBody);

            // サービスからデータを取得
            const data: PostCurrentLocationResponse = await CurrentLocationServiceImpl.postCurrentLocation(
                validatedBody
            );

            // レスポンスのスキーマでバリデーション
            const validatedResponse: PostCurrentLocationResponse = PostCurrentLocationResponseSchema.parse(data);

            this.logInfo("Successfully processed current-location data", {
                teamCode: validatedResponse.transitStation.teamCode,
                stationCode: validatedResponse.transitStation.stationCode,
                point: validatedResponse.point.points,
            });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default CurrentLocationApiHandler;
