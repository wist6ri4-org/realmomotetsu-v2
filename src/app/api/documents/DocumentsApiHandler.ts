import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { DocumentsServiceImpl } from "@/features/documents/service";
import {
    getDocumentsRequestSchema,
} from "@/features/documents/validator";

/**
 * ドキュメントに関するAPIハンドラー
 */
class DocumentsApiHandler extends BaseApiHandler {
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
        this.logInfo("Handling GET request for documents");

        try {
            // クエリパラメータを取得
            const { searchParams } = new URL(req.url);

            // Zodでバリデーション（Object.fromEntriesを使用してURLSearchParamsをオブジェクトに変換）
            const queryParams = Object.fromEntries(searchParams.entries());
            const validatedParams = getDocumentsRequestSchema.parse(queryParams);

            this.logDebug("Request parameters", validatedParams);

            // サービスからデータを取得
            const data = await DocumentsServiceImpl.getDocumentsByEventCode(validatedParams);

            // TODO レスポンスのスキーマでバリデーション
            // const validatedResponse = initOperationResponseSchema.parse(data);

            this.logInfo("Successfully retrieved documents data", {
                documentsCount: data.documents.length,
            });

            return this.createSuccessResponse(data);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default DocumentsApiHandler;
