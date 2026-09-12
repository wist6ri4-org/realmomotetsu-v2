import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { InitServiceImpl } from "@/features/init/service";
import { InitRequestSchema, InitResponseSchema } from "@/features/init/validator";
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
            const validatedParams = InitRequestSchema.parse(queryParams);

            this.logDebug("Request parameters", validatedParams);

            // サービスからデータを取得
            const data: InitResponse = await InitServiceImpl.getDataForInit(validatedParams);

            // レスポンスのスキーマでバリデーション
            const validatedResponse: InitResponse = InitResponseSchema.parse(data);

            this.logInfo("Successfully retrieved init data", {
                teamsCount: validatedResponse.teams.length,
                stationsCount: validatedResponse.stations.length,
                nearbyStationsCount: validatedResponse.nearbyStations.length,
                documentsCount: validatedResponse.documents.length,
                userId: validatedResponse.user.id,
                eventId: validatedResponse.event.eventCode,
            });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default InitApiHandler;
