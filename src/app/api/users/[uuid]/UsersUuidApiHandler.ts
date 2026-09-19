import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { assertSelfOrMasterAdmin } from "@/app/api/utils/auth";
import { Handlers } from "@/app/api/utils/types";
import {
    GetUsersByUuidRequestScheme,
    GetUsersByUuidResponseScheme,
    PutUsersByUuidRequestScheme,
    PutUsersByUuidResponseScheme,
} from "@/features/users/[uuid]/validator";
import { UsersByUuidServiceImpl } from "@/features/users/[uuid]/service";
import { GetUsersByUuidResponse, PutUsersByUuidResponse } from "@/features/users/[uuid]/types";

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

            // 本人、またはmaster adminのみ他ユーザーのプロフィール（メールアドレス・ロール・
            // 参加履歴を含む）を閲覧できる
            assertSelfOrMasterAdmin(this.getAuthUser(), validatedParams.uuid);

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
            // 本人、またはmaster adminのみ更新可能（認証自体はBaseApiHandlerが検証済み）
            assertSelfOrMasterAdmin(this.getAuthUser(), this.uuid);

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
