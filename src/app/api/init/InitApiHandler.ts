import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { InitServiceImpl } from "@/features/init/service";
import { initRequestSchema } from "@/features/init/validator";
import { InitResponse } from "@/features/init/types";

/**
 * 初期データを取得するAPIハンドラー
 */
class InitApiHandler extends BaseApiHandler {
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
        this.logInfo("Handling GET request for init");

        try {
            // クエリパラメータを取得
            const { searchParams } = new URL(req.url);

            // Zodでバリデーション（Object.fromEntriesを使用してURLSearchParamsをオブジェクトに変換）
            const queryParams = Object.fromEntries(searchParams.entries());
            const validatedParams = initRequestSchema.parse(queryParams);

            this.logDebug("Request parameters", validatedParams);

            // サービスからデータを取得
            const data: InitResponse = await InitServiceImpl.getDataForInit(
                validatedParams
            );

            // TODO レスポンスのスキーマでバリデーション
            // const validatedResponse = initFormResponseSchema.parse(data);

            this.logInfo("Successfully retrieved init data", {
                teamsCount: data.teams.length,
                stationsCount: data.stations.length,
                nearbyStationsCount: data.nearbyStations.length,
                documentsCount: data.documents.length,
                userId: data.user.id,
            });

            return this.createSuccessResponse(data);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default InitApiHandler;
