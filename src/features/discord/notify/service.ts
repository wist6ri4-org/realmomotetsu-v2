import { getDiscordNotifier } from "@/utils/discordUtils";
import { PostDiscordNotifyRequest, PostDiscordNotifyResponse } from "./types";
import { DiscordNotifyService } from "./interface";

export const DiscordNotifyServiceImpl: DiscordNotifyService = {
    /**
     * Discord通知を送信する
     * @param {PostDiscordNotifyRequest} req - リクエスト
     * @return {Promise<PostDiscordNotifyResponse>} レスポンス
     */
    postDiscordNotify: async (
        req: PostDiscordNotifyRequest
    ): Promise<PostDiscordNotifyResponse> => {
        const discordWebhookUrl: string = req.discordWebhookUrl;
        const notifier = getDiscordNotifier(discordWebhookUrl);
        try {
            const { templateName, variables } = req;
            const isTextTemplate = templateName.endsWith(".txt");
            await notifier.sendNotification(templateName, variables || {}, isTextTemplate);
            console.log(`Notification sent using template: ${templateName}`);
            // 成功レスポンスを返す
            return { success: true };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes("Discord notifications are not enabled")) {
                console.warn("Discord notifications are not enabled. Skipping notification.");
                return { success: true }; // 成功として扱う
            }

            console.error("Failed to send Discord notification:", error);
            return { success: false };
        }
    },
};
