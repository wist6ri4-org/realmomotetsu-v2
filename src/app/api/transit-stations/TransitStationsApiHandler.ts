import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { TransitStationsServiceImpl } from "@/features/transit-stations/service";
import {
    getTransitStationsRequestSchema,
    postTransitStationsRequestSchema,
} from "@/features/transit-stations/validator";
import {
    GetTransitStationsResponse,
    PostTransitStationsResponse,
} from "@/features/transit-stations/types";

/**
 * 経由駅に関するAPIハンドラー
 */
class TransitStationsApiHandler extends BaseApiHandler {
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
            POST: this.handlePost.bind(this),
        };
    }

    /**
     * GETリクエストを処理するメソッド
     * @param req - Next.jsのリクエストオブジェクト
     * @return {Promise<NextResponse>} - レスポンスオブジェクト
     */
    private async handleGet(req: NextRequest): Promise<NextResponse> {
        this.logInfo("Handling GET request for transit-stations");

        try {
            // クエリパラメータを取得
            const { searchParams } = new URL(req.url);

            // Zodでバリデーション（Object.fromEntriesを使用してURLSearchParamsをオブジェクトに変換）
            const queryParams = Object.fromEntries(searchParams.entries());
            const validatedParams = getTransitStationsRequestSchema.parse(queryParams);

            this.logDebug("Request parameters", validatedParams);

            // サービスからデータを取得
            const data: GetTransitStationsResponse =
                await TransitStationsServiceImpl.getTransitStationsByEventCodeGroupedByTeamCode(
                    validatedParams
                );

            // TODO レスポンスのスキーマでバリデーション
            // const validatedResponse = initOperationResponseSchema.parse(data);

            type Info = {
                [teamCode: string]: {
                    transitStationsCount: number;
                };
            };

            const info: Info = {};
            Object.entries(data.transitStations).forEach(([teamCode, transitStations]) => {
                info[teamCode] = {
                    transitStationsCount: transitStations.length,
                };
            });
            this.logInfo("Successfully retrieved transit-stations data", {
                ...info,
            });

            return this.createSuccessResponse(data);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }

    /**
     * POSTリクエストを処理するメソッド
     * @param req - Next.jsのリクエストオブジェクト
     * @return {Promise<NextResponse>} - レスポンスオブジェクト
     */
    private async handlePost(req: NextRequest): Promise<NextResponse> {
        this.logInfo("Handling POST request for transit-stations");

        try {
            // リクエストボディをJSONとしてパース
            const body = await req.json();

            // Zodでバリデーション
            const validatedBody = postTransitStationsRequestSchema.parse(body);

            this.logDebug("Request body", validatedBody);

            // サービスからデータを取得
            const data: PostTransitStationsResponse =
                await TransitStationsServiceImpl.postTransitStations(validatedBody);

            // TODO レスポンスのスキーマでバリデーション
            // const validatedResponse = initOperationResponseSchema.parse(data);

            this.logInfo("Successfully processed transit-stations data", {
                eventCode: validatedBody.eventCode,
                stationCode: validatedBody.stationCode,
            });

            return this.createSuccessResponse(data);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default TransitStationsApiHandler;
