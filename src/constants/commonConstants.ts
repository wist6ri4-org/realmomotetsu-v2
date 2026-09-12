/**
 * 共通定数
 */
export const CommonConstants = {
    CSS : {
        VARIABLES: {
            // ApplicationBarの高さ
            APPLICATION_BAR_HEIGHT: "--application-bar-height",
            // NavigationBarの高さ
            NAVIGATION_BAR_HEIGHT: "--navigation-bar-height",
        },
    },
    REALTIME: {
        // イベントごとのブロードキャストチャンネル名の接頭辞
        CHANNEL_PREFIX: "event-",
        // データ更新を通知するブロードキャストイベント名
        DATA_CHANGED_EVENT: "data-changed",
        // チャンネルの購読が確立した状態（再接続の検知に使用）
        SUBSCRIBED_STATUS: "SUBSCRIBED",
        // 通知を受けてから再取得するまでの待機時間（連続した通知をまとめるため）
        DEBOUNCE_MS: 300,
        // 直近の取得からこの時間内であれば復帰時の再取得をスキップする
        MIN_REFETCH_INTERVAL_MS: 3000,
    },
} as const;

export type CommonConstants = typeof CommonConstants;
