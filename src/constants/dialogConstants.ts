/**
 * ダイアログに関する定数
 */
export const DialogConstants = {
    TEXT: {
        OK: "OK",
        CANCEL: "キャンセル",
        CLOSE: "閉じる",
    },
    TITLE: {
        REGISTERED: "登録完了",
        UPDATED: "更新完了",
        ERROR: "エラー",
        WARNING: "警告",
    },
    MESSAGE: {
        REGISTER_SUCCESS: "登録が完了しました。",
        REGISTER_FAILURE: "登録に失敗しました。",
        UPDATE_SUCCESS: "更新が完了しました。",
        UPDATE_FAILURE: "更新に失敗しました。",
    },
} as const;

export type DialogConstants = typeof DialogConstants;
