import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { InitRouletteServiceImpl } from "@/features/init-roulette/service";
import { InitRouletteRequestSchema, InitRouletteResponseSchema } from "@/features/init-roulette/validator";
import { InitRouletteResponse } from "@/features/init-roulette/types";

/**
 * 初期ルーレットデータを取得するAPIハンドラー
 */
class InitRouletteApiHandler extends BaseApiHandler {
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
    private async handleGet(req: NextRequest): Promise<NextResponse> {
        this.logInfo("Handling GET request for init-roulette");

        try {
            // クエリパラメータを取得
            const { searchParams } = new URL(req.url);

            // Zodでバリデーション（Object.fromEntriesを使用してURLSearchParamsをオブジェクトに変換）
            const queryParams = Object.fromEntries(searchParams.entries());
            const validatedParams = InitRouletteRequestSchema.parse(queryParams);

            this.logDebug("Request parameters", validatedParams);

            // サービスからデータを取得
            const data: InitRouletteResponse = await InitRouletteServiceImpl.getDataForRoulette(validatedParams);

            // レスポンスのスキーマでバリデーション
            const validatedResponse: InitRouletteResponse = InitRouletteResponseSchema.parse(data);

            this.logInfo("Successfully retrieved init-roulette data", {
                latestTransitStationsCount: validatedResponse.latestTransitStations.length,
            });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default InitRouletteApiHandler;
