import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { InitHomeServiceImpl } from "@/features/init-home/service";
import { initHomeRequestSchema } from "@/features/init-home/validator";

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
            // 必要に応じてPOST, PUT, DELETEも追加
        };
    }

    /**
     * GETリクエストを処理するメソッド
     * クエリパラメータからeventCodeを取得し、サービスからデータを取得する
     * @param req - Next.jsのリクエストオブジェクト
     * @return {Promise<NextResponse>} - レスポンスオブジェクト
     */
    private async handleGet(req: NextRequest): Promise<NextResponse> {
        this.logInfo("Handling GET request for init-home");

        try {
            // クエリパラメータからeventCodeを取得
            const { searchParams } = new URL(req.url);

            // Zodでバリデーション（Object.fromEntriesを使用してURLSearchParamsをオブジェクトに変換）
            const queryParams = Object.fromEntries(searchParams.entries());
            const validatedParams = initHomeRequestSchema.parse(queryParams);

            this.logDebug("Request parameters", validatedParams);

            // サービスからデータを取得
            const data = await InitHomeServiceImpl.getDataForHome(validatedParams);

            // レスポンスのスキーマでバリデーション
            // const validatedResponse = initHomeResponseSchema.parse(data);

            this.logInfo("Successfully retrieved init-home data", {
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

export default InitHomeApiHandler;
