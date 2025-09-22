export const Messages = {
    // 共通
    UNEXPECTED_ERROR: "予期しないエラーが発生しました。",

    // ユーザー関連
    PASSWORD_NOT_MATCH: "パスワードとパスワード（確認用）が一致しません。",
    LOGIN_FAILED: "ログインに失敗しました。メールアドレスとパスワードをご確認ください。",
    ATTENDANCES_NOT_REGISTERED: "参加予定のイベントがありません。登録をお待ちください。",
} as const;

export type Messages = typeof Messages;
