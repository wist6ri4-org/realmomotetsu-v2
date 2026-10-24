import "server-only";
import { after } from "next/server";
import { DiscordNotificationTemplates } from "@/constants/discordNotificationTemplates";
import type { Events } from "@/generated/prisma";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { Converter } from "@/utils/converter";
import { DiscordNotifyServiceImpl } from "./notify/service";
import type { PostDiscordNotifyRequest } from "./notify/types";

type NotificationBuilder = (event: Events) => Promise<PostDiscordNotifyRequest | undefined>;

/**
 * DBのコミット後にだけ呼ぶ。通知内容を確定し、応答後の送信をNext.jsに管理させる。
 * 準備・予約・送信の失敗は登録結果に影響させず、通知ごとに隔離する。
 */
async function scheduleEventNotifications(eventCode: string, builders: NotificationBuilder[]): Promise<void> {
    try {
        const event = await RepositoryFactory.getEventsRepository().findByEventCode(eventCode);
        if (!event.isNotificationEnabled) return;

        await Promise.all(
            builders.map(async (build) => {
                try {
                    const notification = await build(event);
                    if (!notification) return;

                    after(async () => {
                        const context = { eventCode, templateName: notification.templateName };
                        try {
                            const result = await DiscordNotifyServiceImpl.postDiscordNotify(notification);
                            if (!result.success) {
                                console.error("Discord notification failed", context);
                            }
                        } catch {
                            console.error("Discord notification failed", context);
                        }
                    });
                } catch {
                    console.error("Failed to prepare or schedule Discord notification", { eventCode });
                }
            }),
        );
    } catch {
        console.error("Failed to load Discord notification settings", { eventCode });
    }
}

/** 目的駅登録のコミット完了後に呼ぶ。 */
export async function scheduleGoalStationNotification(data: { eventCode: string; stationCode: string }): Promise<void> {
    await scheduleEventNotifications(data.eventCode, [
        async (event) => {
            if (!event.discordWebhookUrl) return;
            const station = await RepositoryFactory.getStationsRepository().findByStationCode(data.stationCode);
            return {
                discordWebhookUrl: event.discordWebhookUrl,
                templateName: DiscordNotificationTemplates.REGISTER_GOAL_STATION,
                variables: { stationName: station?.name || "不明" },
            };
        },
    ]);
}

/** 手動・自動のボンビー履歴登録のコミット完了後に呼ぶ。 */
export async function scheduleBombiiNotification(data: { eventCode: string; teamCode: string }): Promise<void> {
    await scheduleEventNotifications(data.eventCode, [
        async (event) => {
            if (!event.discordWebhookUrl) return;
            const team = await RepositoryFactory.getTeamsRepository().findByTeamCode(data.teamCode);
            return {
                discordWebhookUrl: event.discordWebhookUrl,
                templateName: DiscordNotificationTemplates.REGISTER_BOMBII,
                variables: { teamName: team?.teamName || "不明" },
            };
        },
    ]);
}

/** 現在地と関連ポイントのコミット完了後に呼ぶ。収益は登録時の所有者・金額を使用する。 */
export async function scheduleCurrentLocationNotifications(
    data: { eventCode: string; teamCode: string; stationCode: string },
    revenue?: { discordWebhookUrl: string; points: number; stationName: string },
): Promise<void> {
    await scheduleEventNotifications(data.eventCode, [
        async () => {
            if (!revenue) return;
            return {
                discordWebhookUrl: revenue.discordWebhookUrl,
                templateName: DiscordNotificationTemplates.EARN_REVENUE,
                variables: {
                    stationName: revenue.stationName || "不明",
                    revenueYen: Converter.convertPointsToYenV3(revenue.points),
                },
            };
        },
        async (event) => {
            if (!event.discordWebhookUrl) return;
            const goalStation = await RepositoryFactory.getGoalStationsRepository().findLatestGoalStation(data.eventCode);
            if (!goalStation || goalStation.stationCode !== data.stationCode) return;
            const team = await RepositoryFactory.getTeamsRepository().findByTeamCode(data.teamCode);
            return {
                discordWebhookUrl: event.discordWebhookUrl,
                templateName: DiscordNotificationTemplates.ARRIVAL_GOAL_STATION,
                variables: {
                    teamName: team?.teamName || "不明",
                    stationName: goalStation.station.name || "不明",
                },
            };
        },
    ]);
}
