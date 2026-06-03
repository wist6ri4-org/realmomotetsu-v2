import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "../utils/BaseApiHandler";
import { getPropertyPurchasesService } from "@/features/property-purchases/provider";
import { PropertyPurchasesService } from "@/features/property-purchases/interface";
import { Handlers } from "../utils/types";
import {
    GetPropertyPurchasesRequestSchema,
    GetPropertyPurchasesResponseSchema,
    PostPropertyPurchasesRequestSchema,
    PostPropertyPurchasesResponseSchema,
} from "@/features/property-purchases/validator";
import { GetPropertyPurchasesResponse, PostPropertyPurchasesResponse } from "@/features/property-purchases/types";

/**
 * 物件購入に関するAPIハンドラー
 */
class PropertyPurchasesApiHandler extends BaseApiHandler {
    private readonly service: PropertyPurchasesService;
    /**
     * コンストラクタ
     * @param req - Next.jsのリクエストオブジェクト
     */
    constructor(req: NextRequest, service: PropertyPurchasesService = getPropertyPurchasesService()) {
        super(req);
        this.service = service;
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
        this.logInfo("Handling GET request for property-purchases");

        try {
            // クエリパラメータを取得
            const { searchParams } = new URL(req.url);

            // Zodでバリデーション（Object.fromEntriesを使用してURLSearchParamsをオブジェクトに変換）
            const queryParams = Object.fromEntries(searchParams.entries());
            const validatedParams = GetPropertyPurchasesRequestSchema.parse(queryParams);

            this.logDebug("Request body", validatedParams);

            // サービスからデータを取得
            const data: GetPropertyPurchasesResponse =
                await this.service.getPropertyPurchasesByEventCode(validatedParams);

            // レスポンスのスキーマでバリデーション
            const validatedResponse = GetPropertyPurchasesResponseSchema.parse(data);

            this.logInfo("Successfully retrieved property purchases data", {
                count: validatedResponse.propertyPurchases.length,
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
        this.logInfo("Handling POST request for property-purchases");

        try {
            // リクエストボディをJSONとしてパース
            const body = await req.json();

            // Zodでバリデーション
            const validatedBody = PostPropertyPurchasesRequestSchema.parse(body);

            this.logDebug("Request body", validatedBody);

            // サービスからデータを取得
            const data: PostPropertyPurchasesResponse = await this.service.postPropertyPurchases(validatedBody);

            // レスポンスのスキーマでバリデーション
            const validatedResponse: PostPropertyPurchasesResponse = PostPropertyPurchasesResponseSchema.parse(data);

            this.logInfo("Successfully processed property purchases data", {
                id: validatedResponse.propertyPurchase.id,
            });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default PropertyPurchasesApiHandler;
