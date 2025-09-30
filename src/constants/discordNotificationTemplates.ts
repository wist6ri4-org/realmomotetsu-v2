/**
 * Discord通知テンプレート名
 */
export const DiscordNotificationTemplates = {
    // 目的駅到着時通知
    ARRIVAL_GOAL_STATION: "arrivalGoalStation.txt",
    // ボンビー設定時通知
    REGISTER_BOMBII: "registerBombii.txt",
    // 目的駅設定時通知
    REGISTER_GOAL_STATION: "registerGoalStation.txt",
} as const;

export type DiscordNotificationTemplates = typeof DiscordNotificationTemplates;
