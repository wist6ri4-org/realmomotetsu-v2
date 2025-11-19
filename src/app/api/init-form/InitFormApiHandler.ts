import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { InitFormServiceImpl } from "@/features/init-form/service";
import { InitFormRequestSchema, InitFormResponseSchema } from "@/features/init-form/validator";
import { InitFormResponse } from "@/features/init-form/types";

/**
 * 初期フォームデータを取得するAPIハンドラー
 */
class InitFormApiHandler extends BaseApiHandler {
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
            GET: this.handleGet.bind(this),
        };
    }

    /**
     * GETリクエストを処理するメソッド
     * @param req - Next.jsのリクエストオブジェクト
     * @return {Promise<NextResponse>} - レスポンスオブジェクト
     */
    // NOTE TSK-37 通信頻度最適化対応により本APIは使用しないが、将来の拡張に備えて残す
    private async handleGet(req: NextRequest): Promise<NextResponse> {
        this.logInfo("Handling GET request for init-form");

        try {
            // クエリパラメータを取得
            const { searchParams } = new URL(req.url);

            // Zodでバリデーション（Object.fromEntriesを使用してURLSearchParamsをオブジェクトに変換）
            const queryParams = Object.fromEntries(searchParams.entries());
            const validatedParams = InitFormRequestSchema.parse(queryParams);

            this.logDebug("Request parameters", validatedParams);

            // サービスからデータを取得
            const data: InitFormResponse = await InitFormServiceImpl.getDataForForm(validatedParams);

            // レスポンスのスキーマでバリデーション
            const validatedResponse: InitFormResponse = InitFormResponseSchema.parse(data);

            this.logInfo("Successfully retrieved init-form data", {
                closestStationsCount: validatedResponse.closestStations ? validatedResponse.closestStations.length : 0,
            });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default InitFormApiHandler;
