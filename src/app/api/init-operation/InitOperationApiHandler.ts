import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { InitOperationServiceImpl } from "@/features/init-operation/service";
import { initOperationRequestSchema } from "@/features/init-operation/validator";
import { InitOperationResponse } from "@/features/init-operation/types";

/**
 * 初期オペレーションデータを取得するAPIハンドラー
 */
class InitOperationApiHandler extends BaseApiHandler {
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
        this.logInfo("Handling GET request for init-operation");

        try {
            // クエリパラメータを取得
            const { searchParams } = new URL(req.url);

            // Zodでバリデーション（Object.fromEntriesを使用してURLSearchParamsをオブジェクトに変換）
            const queryParams = Object.fromEntries(searchParams.entries());
            const validatedParams = initOperationRequestSchema.parse(queryParams);

            this.logDebug("Request parameters", validatedParams);

            // サービスからデータを取得
            const data: InitOperationResponse = await InitOperationServiceImpl.getDataForOperation(
                validatedParams
            );

            // TODO レスポンスのスキーマでバリデーション
            // const validatedResponse = initOperationResponseSchema.parse(data);

            this.logInfo("Successfully retrieved init-operation data", {
                teamsCount: data.teams.length,
                stationsCount: data.stations.length,
                closestStationsCount: data.closestStations ? data.closestStations.length : 0,
                teamDataCount: data.teamData ? data.teamData.length : 0,
            });

            return this.createSuccessResponse(data);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default InitOperationApiHandler;
