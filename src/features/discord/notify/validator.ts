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
