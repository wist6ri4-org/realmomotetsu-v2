import { Points, TransitStations } from "@/generated/prisma";

/**
 * 現在地登録のリクエスト
 * @property { string } eventCode - イベントコード
 * @property { string } teamCode - チームコード
 * @property { string } stationCode - 駅コード
 */
export type PostCurrentLocationV3Request = {
    eventCode: string;
    teamCode: string;
    stationCode: string;
};

/**
 * 現在地登録のレスポンス
 * @property { TransitStations } transitStation - 登録された経由駅
 * @property { Points } point - 登録されたポイント
 * @property { string } teamDiscordWebhookUrl - チームのDiscord Webhook URL（収益獲得通知送信用）
 */
export type PostCurrentLocationV3Response = {
    transitStation: TransitStations;
    point?: Points;
    teamDiscordWebhookUrl?: string;
};
