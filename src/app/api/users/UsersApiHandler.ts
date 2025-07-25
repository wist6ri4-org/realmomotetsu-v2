import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { UsersServiceImpl } from "@/features/users/service";
import {
    postUsersRequestSchema,
} from "@/features/users/validator";

/**
 * ユーザーに関するAPIハンドラー
 */
class UsersApiHandler extends BaseApiHandler {
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
            POST: this.handlePost.bind(this),
        };
    }


    /**
     * POSTリクエストを処理するメソッド
     * @param req - Next.jsのリクエストオブジェクト
     * @return {Promise<NextResponse>} - レスポンスオブジェクト
     */
    private async handlePost(req: NextRequest): Promise<NextResponse> {
        this.logInfo("Handling POST request for users");

        try {
            // リクエストボディをJSONとしてパース
            const body = await req.json();

            // Zodでバリデーション
            const validatedBody = postUsersRequestSchema.parse(body);

            this.logDebug("Request body", validatedBody);

            // サービスからデータを取得
            const data = await UsersServiceImpl.postUsers(validatedBody);

            // レスポンスのスキーマでバリデーション
            // const validatedResponse = initOperationResponseSchema.parse(data);

            this.logInfo("Successfully processed users data", {
                id: data.id,
            });

            return this.createSuccessResponse(data);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default UsersApiHandler;
