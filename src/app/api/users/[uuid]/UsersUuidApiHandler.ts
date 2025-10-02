import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import {
    GetUsersByUuidRequestScheme,
    GetUsersByUuidResponseScheme,
    PutUsersByUuidRequestScheme,
    PutUsersByUuidResponseScheme,
} from "@/features/users/[uuid]/validator";
import { UsersByUuidServiceImpl } from "@/features/users/[uuid]/service";
import { GetUsersByUuidResponse, PutUsersByUuidResponse } from "@/features/users/[uuid]/types";
import supabase from "@/lib/supabase";

/**
 * UUIDに紐づくユーザーに関するAPIハンドラー
 */
class UsersByUuidApiHandler extends BaseApiHandler {
    private uuid: string;

    /**
     * コンストラクタ
     * @param {NextRequest} req - Next.jsのリクエストオブジェクト
     * @param {{uuid: string}} params - パスパラメータ（uuid）
     */
    constructor(req: NextRequest, params: { uuid: string }) {
        super(req);
        this.uuid = params.uuid;
    }

    /**
     * HTTPメソッドごとのハンドラーを定義
     * @return {Handlers} - HTTPメソッドごとのハンドラーを定義したオブジェクト
     */
    protected getHandlers(): Handlers {
        return {
            GET: this.handleGet.bind(this),
            PUT: this.handlePut.bind(this),
        };
    }

    /**
     * GETリクエストを処理するメソッド
     * @return {Promise<NextResponse>} - レスポンスオブジェクト
     */
    private async handleGet(): Promise<NextResponse> {
        this.logInfo("Handling GET request for users/[uuid]");

        try {
            const validatedParams = GetUsersByUuidRequestScheme.parse({ uuid: this.uuid });

            this.logDebug("Request parameters", validatedParams);

            // サービスからデータを取得
            const data: GetUsersByUuidResponse = await UsersByUuidServiceImpl.getUsersByUuid(validatedParams);

            // レスポンスのスキーマでバリデーション
            const validatedResponse: GetUsersByUuidResponse = GetUsersByUuidResponseScheme.parse(data);

            this.logInfo("Successfully retrieved user data", { uuid: validatedResponse.user.uuid });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }

    /**
     * PUTリクエストを処理するメソッド
     * @return {Promise<NextResponse>} - レスポンスオブジェクト
     */
    private async handlePut(): Promise<NextResponse> {
        this.logInfo("Handling PUT request for users/[uuid]");

        try {
            // 認証チェック
            const authHeader = this.req.headers.get("authorization");
            if (!authHeader) {
                return this.createErrorResponse("認証が必要です", 401);
            }

            // Authorizationヘッダーからトークンを取得
            const token = authHeader.replace("Bearer ", "");

            // Supabaseでトークンを検証
            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser(token);

            if (authError || !user) {
                return this.createErrorResponse("認証に失敗しました", 401);
            }

            // 自分のプロファイルのみ更新可能かチェック
            if (user.id !== this.uuid) {
                return this.createErrorResponse("他のユーザーのプロファイルは更新できません", 403);
            }

            const requestBody = await this.req.json();
            const validatedParams = PutUsersByUuidRequestScheme.parse({
                uuid: this.uuid,
                ...requestBody,
            });

            this.logDebug("Request parameters", validatedParams);

            // サービスでユーザーを更新
            const data: PutUsersByUuidResponse = await UsersByUuidServiceImpl.putUsersByUuid(validatedParams);

            // レスポンスのスキーマでバリデーション
            const validatedResponse: PutUsersByUuidResponse = PutUsersByUuidResponseScheme.parse(data);

            this.logInfo("Successfully updated user data", { uuid: validatedResponse.user.uuid });

            return this.createSuccessResponse(validatedResponse);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default UsersByUuidApiHandler;
