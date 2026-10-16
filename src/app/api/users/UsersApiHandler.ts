import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { UsersServiceImpl } from "@/features/users/service";
import { PostUsersRequestSchema, PostUsersResponseSchema } from "@/features/users/validator";
import { PostUsersResponse } from "@/features/users/types";

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
     * 認証を必須としない。
     *
     * このエンドポイントは `signUp()` が Supabase Auth にユーザーを作成した直後に
     * public.users のレコードを作るために呼ばれる。その時点ではまだセッションが
     * 確立していないため、認証を要求すると新規登録自体が成立しない。
     *
     * その代わり、リクエストで任意のロールを指定できないよう
     * `PostUsersRequestSchema` から role を除外している。
     *
     * @return {boolean} - 常にfalse
     */
    protected requireAuth(): boolean {
        return false;
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
            const validatedBody = PostUsersRequestSchema.parse(body);

            this.logDebug("Request body", validatedBody);

            // サービスからデータを取得
            const data: PostUsersResponse = await UsersServiceImpl.postUsers(validatedBody);

            // レスポンスのスキーマでバリデーション
            const validatedResponse: PostUsersResponse = PostUsersResponseSchema.parse(data);

            this.logInfo("Successfully processed users data", {
                id: validatedResponse.user.id,
            });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default UsersApiHandler;
