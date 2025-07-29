import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";
import { getUsersByUuidRequestScheme } from "@/features/users/[uuid]/validator";
import { UsersByUuidServiceImpl } from "@/features/users/[uuid]/service";
import { GetUsersByUuidResponse } from "@/features/users/[uuid]/types";

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
        };
    }

    /**
     * GETリクエストを処理するメソッド
     * @return {Promise<NextResponse>} - レスポンスオブジェクト
     */
    private async handleGet(): Promise<NextResponse> {
        this.logInfo("Handling GET request for users/[uuid]");

        try {
            const validatedParams = getUsersByUuidRequestScheme.parse({ uuid: this.uuid });

            this.logDebug("Request parameters", validatedParams);

            // サービスからデータを取得
            const data: GetUsersByUuidResponse = await UsersByUuidServiceImpl.getUsersByUuid(
                validatedParams
            );

            // TODO レスポンスのスキーマでバリデーション
            // const validatedResponse = initOperationResponseSchema.parse(data);

            this.logInfo("Successfully retrieved user data", { uuid: this.uuid });

            return this.createSuccessResponse(data);
        } catch (error) {
            // 基底クラスのhandleErrorメソッドを使用してZodErrorも適切に処理
            return this.handleError(error);
        }
    }
}

export default UsersByUuidApiHandler;
