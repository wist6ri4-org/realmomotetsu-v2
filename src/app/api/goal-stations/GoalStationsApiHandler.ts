import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { GoalStationsServiceImpl } from "@/features/goal-stations/service";
import {
    GetGoalStationsRequestSchema,
    GetGoalStationsResponseSchema,
    PostGoalStationsRequestSchema,
    PostGoalStationsResponseSchema,
} from "@/features/goal-stations/validator";
import { GetGoalStationsResponse, PostGoalStationsResponse } from "@/features/goal-stations/types";

/**
 * 目的駅に関するAPIハンドラー
 */
class GoalStationsApiHandler extends BaseApiHandler {
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
        this.logInfo("Handling GET request for goal-stations");

        try {
            // クエリパラメータを取得
            const { searchParams } = new URL(req.url);

            // Zodでバリデーション（Object.fromEntriesを使用してURLSearchParamsをオブジェクトに変換）
            const queryParams = Object.fromEntries(searchParams.entries());
            const validatedParams = GetGoalStationsRequestSchema.parse(queryParams);

            this.logDebug("Request parameters", validatedParams);

            // サービスからデータを取得
            const data: GetGoalStationsResponse = await GoalStationsServiceImpl.getGoalStationsByEventCode(
                validatedParams
            );

            // レスポンスのスキーマでバリデーション
            const validatedResponse: GetGoalStationsResponse = GetGoalStationsResponseSchema.parse(data);

            this.logInfo("Successfully retrieved goal-stations data", {
                goalStationsCount: validatedResponse.goalStations.length,
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
        this.logInfo("Handling POST request for goal-stations");

        try {
            // リクエストボディをJSONとしてパース
            const body = await req.json();

            // Zodでバリデーション
            const validatedBody = PostGoalStationsRequestSchema.parse(body);

            this.logDebug("Request body", validatedBody);

            // サービスからデータを取得
            const data: PostGoalStationsResponse = await GoalStationsServiceImpl.postGoalStations(validatedBody);

            // レスポンスのスキーマでバリデーション
            const validatedResponse: PostGoalStationsResponse = PostGoalStationsResponseSchema.parse(data);

            this.logInfo("Successfully processed goal-stations data", {
                eventCode: validatedResponse.goalStation.eventCode,
                stationCode: validatedResponse.goalStation.stationCode,
            });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default GoalStationsApiHandler;
