import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { PointsBulkServiceImpl } from "@/features/points/bulk/service";
import { PostBulkPointsRequestSchema, PostBulkPointsResponseSchema } from "@/features/points/bulk/validator";
import { PostBulkPointsResponse } from "@/features/points/bulk/types";
import { PointsBulkService } from "@/features/points/bulk/interface";
import { getPointsBulkService } from "@/features/points/bulk/provider";

/**
 * ポイント移動に関するAPIハンドラー
 */
class PointsBulkApiHandler extends BaseApiHandler {
    private readonly service: PointsBulkService;
    /**
     * コンストラクタ
     * @param req - Next.jsのリクエストオブジェクト
     * @param service - PointsBulkServiceの実装（デフォルトはPointsBulkServiceImpl）
     */
    constructor(req: NextRequest, service: PointsBulkService = getPointsBulkService()) {
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
     * POSTリクエストを処理するメソッド（移動元マイナス・移動先プラスの2件をトランザクションで登録）
     * @param req - Next.jsのリクエストオブジェクト
     * @return {Promise<NextResponse>} - レスポンスオブジェクト
     */
    private async handlePost(req: NextRequest): Promise<NextResponse> {
        this.logInfo("Handling POST request for points bulk");

        try {
            // リクエストボディをJSONとしてパース
            const body = await req.json();

            // Zodでバリデーション
            const validatedBody = PostBulkPointsRequestSchema.parse(body);

            this.logDebug("Request body", validatedBody);

            // サービスからデータを取得
            const data: PostBulkPointsResponse = await this.service.postBulkPoints(validatedBody);

            // レスポンスのスキーマでバリデーション
            const validatedResponse: PostBulkPointsResponse = PostBulkPointsResponseSchema.parse(data);

            this.logInfo("Successfully processed bulk points data", {
                fromPointId: validatedResponse.fromPoint.id,
                toPointId: validatedResponse.toPoint.id,
            });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default PointsBulkApiHandler;
