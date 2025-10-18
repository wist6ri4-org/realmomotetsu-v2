import fs from "fs/promises";
import path from "path";

/**
 * Discordのメッセージ形式
 * @property {string} [content] - メッセージのテキスト内容
 * @property {DiscordEmbed[]} [embeds] - 埋め込みメッセージの配列
 */
export interface DiscordMessage {
    content?: string;
    embeds?: DiscordEmbed[];
}

/**
 * Discordの埋め込みメッセージ形式
 * @property {string} [title] - 埋め込みのタイトル
 * @property {string} [description] - 埋め込みの説明
 * @property {number} [color] - 埋め込みの色（整数値）
 * @property {DiscordEmbedField[]} [fields] - 埋め込みのフィールド
 * @property {Object} [footer] - 埋め込みのフッター
 * @property {string} [footer.text] - フッターのテキスト
 * @property {string} [timestamp] - 埋め込みのタイムスタンプ（ISO 8601形式）
 */
export interface DiscordEmbed {
    title?: string;
    description?: string;
    color?: number;
    fields?: DiscordEmbedField[];
    footer?: {
        text: string;
    };
    timestamp?: string;
}

/**
 * Discordの埋め込みフィールド形式
 * @property {string} name - フィールドの名前
 * @property {string} value - フィールドの値
 * @property {boolean} [inline] - フィールドをインライン表示するかどうか
 */
export interface DiscordEmbedField {
    name: string;
    value: string;
    inline?: boolean;
}

/**
 * Discordのメッセージテンプレート形式
 * @property {string} [content] - メッセージのテキスト内容
 * @property {Object} [embed] - 埋め込みメッセージのオブジェクト
 * @property {string} [embed.title] - 埋め込みのタイトル
 * @property {string} [embed.description] - 埋め込みの説明
 * @property {number} [embed.color] - 埋め込みの色（整数値）
 * @property {Array<Object>} [embed.fields] - 埋め込みのフィールドの配列
 * @property {string} [embed.fields.name] - フィールドの名前
 * @property {string} [embed.fields.value] - フィールドの値
 * @property {boolean} [embed.fields.inline] - フィールドをインライン表示するかどうか
 */
export interface MessageTemplate {
    content?: string;
    embed?: {
        title?: string;
        description?: string;
        color?: number;
        fields?: Array<{
            name: string;
            value: string;
            inline?: boolean;
        }>;
    };
}

export class DiscordNotifier {
    private webhookUrl: string;
    private templatesCache: Map<string, MessageTemplate> = new Map();

    constructor(webhookUrl: string) {
        this.webhookUrl = webhookUrl;
    }

    /**
     * テンプレートファイルを読み込む（JSON形式）
     */
    private async loadJsonTemplate(templateName: string): Promise<MessageTemplate> {
        if (this.templatesCache.has(templateName)) {
            return this.templatesCache.get(templateName)!;
        }

        try {
            const templatePath = path.join(process.cwd(), "src", "templates", "discord", `${templateName}.json`);
            const templateContent = await fs.readFile(templatePath, "utf-8");
            const template = JSON.parse(templateContent) as MessageTemplate;

            this.templatesCache.set(templateName, template);
            return template;
        } catch (error) {
            throw new Error(`Failed to load JSON template "${templateName}": ${error}`);
        }
    }

    /**
     * テンプレートファイルを読み込む（テキスト形式）
     */
    private async loadTextTemplate(templateName: string): Promise<string> {
        try {
            const templatePath = path.join(process.cwd(), "src", "templates", "discord", `${templateName}`);
            const templateContent = await fs.readFile(templatePath, "utf-8");
            return templateContent;
        } catch (error) {
            throw new Error(`Failed to load text template "${templateName}": ${error}`);
        }
    }

    /**
     * テンプレート内の変数を置換する
     */
    private replaceVariables(text: string, variables: Record<string, string>): string {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return variables[key] || match;
        });
    }

    /**
     * JSONテンプレートからDiscordメッセージを生成する
     */
    private async generateFromJsonTemplate(
        templateName: string,
        variables: Record<string, string>
    ): Promise<DiscordMessage> {
        const template = await this.loadJsonTemplate(templateName);
        const message: DiscordMessage = {};

        if (template.content) {
            message.content = this.replaceVariables(template.content, variables);
        }

        if (template.embed) {
            const embed: DiscordEmbed = {
                timestamp: new Date().toISOString(),
            };

            if (template.embed.title) {
                embed.title = this.replaceVariables(template.embed.title, variables);
            }

            if (template.embed.description) {
                embed.description = this.replaceVariables(template.embed.description, variables);
            }

            if (template.embed.color !== undefined) {
                embed.color = template.embed.color;
            }

            if (template.embed.fields) {
                embed.fields = template.embed.fields.map((field) => ({
                    name: this.replaceVariables(field.name, variables),
                    value: this.replaceVariables(field.value, variables),
                    inline: field.inline || false,
                }));
            }

            message.embeds = [embed];
        }

        return message;
    }

    /**
     * テキストテンプレートからシンプルメッセージを生成する
     */
    private async generateFromTextTemplate(
        templateName: string,
        variables: Record<string, string>
    ): Promise<DiscordMessage> {
        const template = await this.loadTextTemplate(templateName);
        const content = this.replaceVariables(template, variables);
        return { content };
    }

    /**
     * Discord に通知を送信する
     */
    async sendNotification(
        templateName: string,
        variables: Record<string, string> = {},
        isTextTemplate: boolean = false
    ): Promise<void> {
        try {
            const message = isTextTemplate
                ? await this.generateFromTextTemplate(templateName, variables)
                : await this.generateFromJsonTemplate(templateName, variables);

            const response = await fetch(this.webhookUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(message),
            });

            if (!response.ok) {
                throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error("Failed to send Discord notification:", error);
            throw error;
        }
    }

    /**
     * 簡単なテキストメッセージを送信する
     */
    async sendSimpleMessage(content: string): Promise<void> {
        try {
            const response = await fetch(this.webhookUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ content }),
            });

            if (!response.ok) {
                throw new Error(`Discord API error: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.error("Failed to send Discord message:", error);
            throw error;
        }
    }
}

// Webhook URLごとにDiscordNotifierインスタンスを管理するマップ
const discordNotifiers: Map<string, DiscordNotifier> = new Map();

/**
 * DiscordNotifierの初期化
 * @param webhookUrl - DiscordのWebhook URL
 */
export function initializeDiscordNotifier(webhookUrl: string): void {
    if (!webhookUrl) return;
    if (!discordNotifiers.has(webhookUrl)) {
        discordNotifiers.set(webhookUrl, new DiscordNotifier(webhookUrl));
    }
}

/**
 * DiscordNotifierを取得する（必要なら初期化）
 * @param discordWebhookUrl - DiscordのWebhook URL
 * @returns {DiscordNotifier} - 初期化されたDiscordNotifierインスタンス
 */
export function getDiscordNotifier(discordWebhookUrl: string): DiscordNotifier {
    if (!discordWebhookUrl) {
        throw new Error("Discord webhook URL is required");
    }

    if (!discordNotifiers.has(discordWebhookUrl)) {
        initializeDiscordNotifier(discordWebhookUrl);
    }

    // has()したので存在するはず
    return discordNotifiers.get(discordWebhookUrl)!;
}
