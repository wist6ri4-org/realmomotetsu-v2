import { z } from "zod";

/**
 * Discord通知のリクエスト
 * @property { string } templateName - 使用するテンプレートの名前
 * @property { Record<string, string> } [variables] - テンプレートに埋め込む変数
 */
export const PostDiscordNotifyRequestSchema = z.object({
    templateName: z.string(),
    variables: z.record(z.string()).optional(),
});

/**
 * Discord通知のレスポンス
 * @property { boolean } success - 通知が成功したかどうか
 */
export const PostDiscordNotifyResponseSchema = z.object({
    success: z.boolean(),
});