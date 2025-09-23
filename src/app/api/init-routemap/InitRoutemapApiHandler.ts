import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { initRoutemapRequestSchema } from "@/features/init-routemap/validator";
import { InitRoutemapResponse } from "@/features/init-routemap/types";
import { InitRoutemapServiceImpl } from "@/features/init-routemap/service";

/**
 * 初期路線図データを取得するAPIハンドラー
 */
class InitRoutemapApiHandler extends BaseApiHandler {
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
        this.logInfo("Handling GET request for routemap");

        try {
            // クエリパラメータを取得
            const { searchParams } = new URL(req.url);

            // Zodでバリデーション（Object.fromEntriesを使用してURLSearchParamsをオブジェクトに変換）
            const queryParams = Object.fromEntries(searchParams.entries());
            const validatedParams = initRoutemapRequestSchema.parse(queryParams);

            this.logDebug("Request parameters", validatedParams);

            // サービスからデータを取得
            const data: InitRoutemapResponse = await InitRoutemapServiceImpl.getDataForRoutemap(validatedParams);

            // TODO レスポンスのスキーマでバリデーション
            // const validatedResponse = initFormResponseSchema.parse(data);

            this.logInfo("Successfully retrieved init-routemap data", {
                teamDataCount: data.teamData.length,
                hasNextGoal: !!data.nextGoalStation,
                hasBombiiTeam: !!data.bombiiTeam,
            });

            return this.createSuccessResponse(data);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default InitRoutemapApiHandler;
