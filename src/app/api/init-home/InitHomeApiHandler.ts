import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { InitHomeServiceImpl } from "@/features/init-home/service";
import { InitHomeRequestSchema, InitHomeResponseSchema } from "@/features/init-home/validator";
import { InitHomeResponse } from "@/features/init-home/types";

/**
 * 初期ホームデータを取得するAPIハンドラー
 */
class InitHomeApiHandler extends BaseApiHandler {
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
        this.logInfo("Handling GET request for init-home");

        try {
            // クエリパラメータを取得
            const { searchParams } = new URL(req.url);

            // Zodでバリデーション（Object.fromEntriesを使用してURLSearchParamsをオブジェクトに変換）
            const queryParams = Object.fromEntries(searchParams.entries());
            const validatedParams = InitHomeRequestSchema.parse(queryParams);

            this.logDebug("Request parameters", validatedParams);

            // サービスからデータを取得
            const data: InitHomeResponse = await InitHomeServiceImpl.getDataForHome(validatedParams);

            // レスポンスのスキーマでバリデーション
            const validatedResponse: InitHomeResponse = InitHomeResponseSchema.parse(data);

            this.logInfo("Successfully retrieved init-home data", {
                teamDataCount: validatedResponse.teamData.length,
                hasNextGoal: !!validatedResponse.nextGoalStation,
                hasBombiiTeam: !!validatedResponse.bombiiTeam,
            });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default InitHomeApiHandler;
