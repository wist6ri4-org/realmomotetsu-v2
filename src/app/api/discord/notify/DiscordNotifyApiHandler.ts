import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "../../utils/BaseApiHandler";
import { PostDiscordNotifyRequestSchema, PostDiscordNotifyResponseSchema } from "@/features/discord/notify/validator";
import { DiscordNotifyServiceImpl } from "@/features/discord/notify/service";
import { PostDiscordNotifyResponse } from "@/features/discord/notify/types";

/**
 * Discord通知に関するAPIハンドラー
 */
class DiscordNotifyApiHandler extends BaseApiHandler {
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
    protected getHandlers() {
        return {
            POST: this.handlePost.bind(this),
        };
    }

    /**
     * POSTリクエストを処理するメソッド
     * @param req - Next.jsのリクエストオブジェクト
     * @return {Promise<NextResponse>} - レスポンスオブジェクト
     */
    private async handlePost(req: NextRequest): Promise<NextResponse> {
        this.logInfo("Handling POST request for Discord notification");

        try {
            // リクエストボディをJSONとしてパース
            const body = await req.json();

            // Zodでバリデーション
            const validatedBody = PostDiscordNotifyRequestSchema.parse(body);

            this.logDebug("Request body", validatedBody);

            // サービスからデータを取得
            const data: PostDiscordNotifyResponse = await DiscordNotifyServiceImpl.postDiscordNotify(validatedBody);

            // レスポンスのスキーマでバリデーション
            const validatedResponse: PostDiscordNotifyResponse = PostDiscordNotifyResponseSchema.parse(data);

            this.logInfo("Successfully processed Discord notification", {
                success: validatedResponse.success,
            });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default DiscordNotifyApiHandler;
