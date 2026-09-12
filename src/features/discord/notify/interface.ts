import { PostDiscordNotifyRequest, PostDiscordNotifyResponse } from "./types";

export interface DiscordNotifyService {
    /**
     * Discord通知を送信する
     * @param {PostDiscordNotifyRequest} req - リクエスト
     * @return {Promise<PostDiscordNotifyResponse>} レスポンス
     */
    postDiscordNotify(req: PostDiscordNotifyRequest): Promise<PostDiscordNotifyResponse>;
}
