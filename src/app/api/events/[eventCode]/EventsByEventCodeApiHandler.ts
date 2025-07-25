import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { EventByEventCodeServiceImpl } from "@/features/events/[eventCode]/service";
import { getEventByEventCodeRequestScheme } from "@/features/events/[eventCode]/validator";

/**
 * イベントコードに紐づくイベントに関するAPIハンドラー
 */
class EventByEventCodeApiHandler extends BaseApiHandler {
    private eventCode: string;

    /**
     * コンストラクタ
     * @param req - Next.jsのリクエストオブジェクト
     */
    constructor(req: NextRequest, params: { eventCode: string }) {
        super(req);
        this.eventCode = params.eventCode;
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
     * @return {Promise<NextResponse>} - レスポンスオブジェクト
     */
    private async handleGet(): Promise<NextResponse> {
        this.logInfo("Handling GET request for events/[eventCode]");

        try {
            const validatedParams = getEventByEventCodeRequestScheme.parse({ eventCode: this.eventCode });

            this.logDebug("Request parameters", validatedParams);

            // サービスからデータを取得
            const data = await EventByEventCodeServiceImpl.getEventByEventCode(validatedParams);

            // レスポンスのスキーマでバリデーション
            // const validatedResponse = initOperationResponseSchema.parse(data);

            if (!data) {
                return this.createErrorResponse("Event not found", 404);
            }

            this.logInfo("Successfully retrieved event data", { eventCode: this.eventCode });

            return this.createSuccessResponse(data);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default EventByEventCodeApiHandler;
