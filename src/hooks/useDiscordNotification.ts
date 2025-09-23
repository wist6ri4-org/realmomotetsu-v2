import { useState } from "react";

/**
 * Discord通知の送信オプション
 * @property {string} templateName - 使用するテンプレートの名前
 * @property {Record<string, string>} [variables] - テンプレートに埋め込む変数
 */
interface NotificationOptions {
    templateName: string;
    variables?: Record<string, string>;
}

/**
 * 通知の送信結果
 * @property {boolean} success - 通知の送信が成功したかどうか
 * @property {string} [message] - 成功時のメッセージ
 * @property {string} [error] - エラー時のメッセージ
 * @property {Record<string, string>} [details] - エラーの詳細情報
 */
interface NotificationResult {
    success: boolean;
    message?: string;
    error?: string;
    details?: string;
}

/**
 * Discord通知を送信するためのカスタムフック
 * @returns {Object} - フックの戻り値
 * @property {Function} sendNotification - 通知を送信する関数
 * @property {boolean} isLoading - 通知送信中かどうかのフラグ
 * @property {string|null} error - エラーメッセージ
 * @property {Function} clearError - エラーをクリアする関数
 */
export function useDiscordNotification(): {
    sendNotification: (options: NotificationOptions) => Promise<NotificationResult>;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
} {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Discord通知を送信する関数
     * @param {NotificationOptions} options - 通知の送信オプション
     * @return {Promise<NotificationResult>} - 通知送信の結果
     */
    const sendNotification = async ({
        templateName,
        variables,
    }: NotificationOptions): Promise<NotificationResult> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/discord/notify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ templateName, variables }),
            });

            const result = await response.json();

            if (!response.ok) {
                const errorMessage = result.details || result.error || `HTTP ${response.status}`;
                setError(errorMessage);
                throw new Error(errorMessage);
            }

            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "通知の送信に失敗しました";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * エラーをクリアする関数
     * @return {void}
     */
    const clearError = () => setError(null);

    return {
        sendNotification,
        isLoading,
        error,
        clearError,
    };
}
