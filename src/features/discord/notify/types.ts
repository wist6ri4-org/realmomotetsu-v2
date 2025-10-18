/**
 * Discord通知のリクエスト
 * @property { string } discordWebhookUrl - DiscordのWebhook URL
 * @property { string } templateName - 使用するテンプレートの名前
 * @property { Record<string, string> } [variables] - テンプレートに埋め込む変数
 */
export type PostDiscordNotifyRequest = {
    discordWebhookUrl: string;
    templateName: string;
    variables?: Record<string, string>;
};

/**
 * Discord通知のレスポンス
 * @property { boolean } success - 通知の送信が成功したかどうか
 */
export type PostDiscordNotifyResponse = {
    success: boolean;
};
