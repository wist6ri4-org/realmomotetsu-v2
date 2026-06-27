/**
 * ダイアログに関する定数
 */
export const DialogConstants = {
    TEXT: {
        OK: "ＯＫ",
        CANCEL: "キャンセル",
        CLOSE: "閉じる",
    },
    TITLE: {
        REGISTERED: "登録完了",
        UPDATED: "更新完了",
        ERROR: "エラー",
        WARNING: "警告",
        PLUS_STATION: "プラス駅　到着！",
        MINUS_STATION: "マイナス駅　到着！",
        CARD_STATION: "カード駅　到着！",
        MISSION_STATION: "ミッション駅　到着！",
        TREASURE_STATION: "宝くじ駅　到着！",
    },
    MESSAGE: {
        REGISTER_SUCCESS: "登録が完了しました。",
        REGISTER_FAILURE: "登録に失敗しました。",
        UPDATE_SUCCESS: "更新が完了しました。",
        UPDATE_FAILURE: "更新に失敗しました。",
    },
} as const;

export type DialogConstants = typeof DialogConstants;
