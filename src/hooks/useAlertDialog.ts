import { useState, useCallback } from "react";

/**
 * アラートダイアログのオプション型定義
 * @property {string} title - ダイアログのタイトル（オプション）
 * @property {string} message - ダイアログのメッセージ
 * @property {string} okText - 確認ボタンのテキスト（オプション）
 */
interface AlertDialogOptions {
    title?: string;
    message: string;
    okText?: string;
}

/**
 * カスタムフック: アラートダイアログの管理
 * @return {object} - アラートダイアログの管理に必要な関数と状態
 */
export const useAlertDialog = (): object => {
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertOptions, setAlertOptions] = useState<AlertDialogOptions>({
        message: "",
    });
    const [resolvePromise, setResolvePromise] = useState<(() => void) | null>(null);

    const showAlertDialog = useCallback((options: AlertDialogOptions): Promise<void> => {
        return new Promise<void>((resolve) => {
            setAlertOptions(options);
            setResolvePromise(() => resolve);
            setIsAlertOpen(true);
        });
    }, []);

    const handleAlertOk = useCallback(() => {
        setIsAlertOpen(false);
        if (resolvePromise) {
            resolvePromise();
            setResolvePromise(null);
        }
    }, [resolvePromise]);

    return {
        isAlertOpen,
        alertOptions,
        showAlertDialog,
        handleAlertOk,
    };
};
