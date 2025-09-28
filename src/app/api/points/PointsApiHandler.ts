import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { PointsServiceImpl } from "@/features/points/service";
import {
    GetPointsRequestSchema,
    GetPointsResponseSchema,
    PostPointsRequestSchema,
    PostPointsResponseSchema,
    PutPointsRequestSchema,
} from "@/features/points/validator";
import { GetPointsResponse, PostPointsResponse, PutPointsResponse } from "@/features/points/types";
import { PutPointsResponseSchema } from "../../../features/points/validator";

/**
 * ポイントに関するAPIハンドラー
 */
class PointsApiHandler extends BaseApiHandler {
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
            PUT: this.handlePut.bind(this),
        };
    }

    /**
     * GETリクエストを処理するメソッド
     * @param req - Next.jsのリクエストオブジェクト
     * @return {Promise<NextResponse>} - レスポンスオブジェクト
     */
    private async handleGet(req: NextRequest): Promise<NextResponse> {
        this.logInfo("Handling GET request for points");

        try {
            // クエリパラメータを取得
            const { searchParams } = new URL(req.url);

            // Zodでバリデーション（Object.fromEntriesを使用してURLSearchParamsをオブジェクトに変換）
            const queryParams = Object.fromEntries(searchParams.entries());
            const validatedParams = GetPointsRequestSchema.parse(queryParams);

            this.logDebug("Request parameters", validatedParams);

            // サービスからデータを取得
            const data: GetPointsResponse = await PointsServiceImpl.getPointsByEventCodeGroupedByTeamCode(
                validatedParams
            );

            // レスポンスのスキーマでバリデーション
            const validatedResponse: GetPointsResponse = GetPointsResponseSchema.parse(data);

            type LogObject = {
                [teamCode: string]: {
                    pointsCount: number;
                    scoredCount: number;
                };
            };

            const logObject: LogObject = {};
            Object.entries(validatedResponse.points).forEach(([teamCode, items]) => {
                if (!logObject[teamCode]) {
                    logObject[teamCode] = { pointsCount: 0, scoredCount: 0 };
                }
                logObject[teamCode].pointsCount = items.points.length;
                logObject[teamCode].scoredCount = items.scored.length;
            });
            this.logInfo("Successfully retrieved points data", {
                ...logObject,
            });

            return this.createSuccessResponse(validatedResponse);
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
        this.logInfo("Handling POST request for points");

        try {
            // リクエストボディをJSONとしてパース
            const body = await req.json();

            // Zodでバリデーション
            const validatedBody = PostPointsRequestSchema.parse(body);

            this.logDebug("Request body", validatedBody);

            // サービスからデータを取得
            const data: PostPointsResponse = await PointsServiceImpl.postPoints(validatedBody);

            // レスポンスのスキーマでバリデーション
            const validatedResponse: PostPointsResponse = PostPointsResponseSchema.parse(data);

            this.logInfo("Successfully processed points data", {
                id: validatedResponse.point.id,
            });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }

    /**
     * PUTリクエストを処理するメソッド
     * @param req - Next.jsのリクエストオブジェクト
     * @return {Promise<NextResponse>} - レスポンスオブジェクト
     */
    private async handlePut(req: NextRequest): Promise<NextResponse> {
        this.logInfo("Handling PUT request for points");

        try {
            // リクエストボディをJSONとしてパース
            const body = await req.json();

            // Zodでバリデーション
            const validatedBody = PutPointsRequestSchema.parse(body);

            this.logDebug("Request body", validatedBody);

            // サービスからデータを取得
            const data: PutPointsResponse = await PointsServiceImpl.putPoints(validatedBody);

            // レスポンスのスキーマでバリデーション
            const validatedResponse: PutPointsResponse = PutPointsResponseSchema.parse(data);

            this.logInfo("Successfully updated points data", {
                count: validatedResponse.count,
            });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default PointsApiHandler;
