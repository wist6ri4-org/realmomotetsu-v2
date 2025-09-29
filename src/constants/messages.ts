export const Messages = {
    // 共通
    UNEXPECTED_ERROR: "予期しないエラーが発生しました。",

    // ユーザー関連
    PASSWORD_NOT_MATCH: "パスワードとパスワード（確認用）が一致しません。",
    LOGIN_FAILED: "ログインに失敗しました。メールアドレスとパスワードをご確認ください。",
    ATTENDANCES_NOT_REGISTERED: "参加予定のイベントがありません。登録をお待ちください。",

    // バリデーション関連
    VALUE_MUST_BE_POSITIVE: "{field}は0より大きい値で入力してください。",
    VALUE_MUST_BE_AT_LEAST: "{field}は{min}以上の値で入力してください。",
    VALUE_MUST_BE_AT_MOST: "{field}は{max}以下の値で入力してください。",
    VALUE_MUST_BE_BETWEEN: "{field}は{min}以上{max}以下の値で入力してください。",
    FIELD_IS_REQUIRED: "{field}は必須項目です。",
    INVALID_FORMAT: "{field}の形式が正しくありません。",

    // API関連
    API_REQUEST_FAILED: "API リクエストが失敗しました。ステータス: {status}",
    NETWORK_ERROR: "ネットワークエラーが発生しました。接続を確認してください。",
    SERVER_ERROR: "サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。",

    // 共通
    REGISTER_SUCCESS: "{data}の登録が完了しました。",
    REGISTER_FAILED: "{data}の登録に失敗しました。",
    UPDATE_SUCCESS: "{data}の更新が完了しました。",
    UPDATE_FAILED: "{data}の更新に失敗しました。",

    // 業務固有
    TEAM_NOT_SELECTED: "チームが選択されていません。",
    ARRIVAL_GOAL_STATIONS_FAILED: "目的駅到着処理に失敗しました。",
    ARRIVAL_GOAL_STATIONS_SUCCESS: "目的駅到着処理が完了しました。",
    POINTS_EXCHANGE_FAILED: "ポイントの換金処理に失敗しました。",
    POINTS_EXCHANGE_SUCCESS: "ポイントの換金処理が完了しました。",
    SAME_TEAM_ERROR: "移動元チームと移動先チームは異なるチームを選択してください。",
    POINTS_TRANSFER_FAILED: "ポイントの移動処理に失敗しました。",
    POINTS_TRANSFER_SUCCESS: "ポイントの移動処理が完了しました。",
} as const;

export type Messages = typeof Messages;

/**
 * メッセージテンプレートのプレースホルダーを置換する
 * @param template メッセージテンプレート
 * @param params 置換パラメータ
 * @returns 置換後のメッセージ
 */
export const formatMessage = (template: string, params: Record<string, string | number>): string => {
    return template.replace(/{(\w+)}/g, (match, key) => {
        const value = params[key];
        return value !== undefined ? String(value) : match;
    });
};

/**
 * Messages定数から指定されたキーのメッセージを取得し、パラメータを置換する
 * @param messageKey メッセージキー
 * @param params 置換パラメータ（オプション）
 * @returns 置換後のメッセージ
 */
export const getMessage = (messageKey: keyof Messages, params?: Record<string, string | number>): string => {
    const template = Messages[messageKey];
    return params ? formatMessage(template, params) : template;
};
