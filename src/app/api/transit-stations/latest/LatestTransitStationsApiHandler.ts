import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import {
    GetLatestTransitStationsRequestSchema,
    GetLatestTransitStationsResponseSchema,
} from "@/features/transit-stations/latest/validator";
import { LatestTransitStationsServiceImpl } from "@/features/transit-stations/latest/service";
import { GetLatestTransitStationsResponse } from "@/features/transit-stations/latest/types";

/**
 * 最新経由駅に関するAPIハンドラー
 */
class LatestTransitStationsApiHandler extends BaseApiHandler {
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
        this.logInfo("Handling GET request for transit-stations/latest");

        try {
            // クエリパラメータを取得
            const { searchParams } = new URL(req.url);

            // Zodでバリデーション（Object.fromEntriesを使用してURLSearchParamsをオブジェクトに変換）
            const queryParams = Object.fromEntries(searchParams.entries());
            const validatedParams = GetLatestTransitStationsRequestSchema.parse(queryParams);

            this.logDebug("Request parameters", validatedParams);

            // サービスからデータを取得
            const data: GetLatestTransitStationsResponse =
                await LatestTransitStationsServiceImpl.getLatestTransitStationsByEventCode(validatedParams);

            // レスポンスのスキーマでバリデーション
            const validatedResponse: GetLatestTransitStationsResponse =
                GetLatestTransitStationsResponseSchema.parse(data);

            this.logInfo("Successfully retrieved transit-stations data", {
                transitStationsCount: validatedResponse.latestTransitStations.length,
            });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default LatestTransitStationsApiHandler;
