import { useState, useCallback } from "react";

/**
 * 確認ダイアログのオプション型定義
 * @property {string} title - ダイアログのタイトル（オプション）
 * @property {string} message - ダイアログのメッセージ
 * @property {string} confirmText - 確認ボタンのテキスト（オプション）
 * @property {string} cancelText - キャンセルボタンのテキスト（オプション）
 */
interface ConfirmDialogOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
}

/**
 * カスタムフック: 確認ダイアログの管理
 * @return {object} - 確認ダイアログの管理に必要な関数と状態
 */
export const useConfirmDialog = (): object => {
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [dialogOptions, setDialogOptions] = useState<ConfirmDialogOptions>({
        message: "",
    });
    const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

    const showConfirmDialog = useCallback((options: ConfirmDialogOptions): Promise<boolean> => {
        return new Promise<boolean>((resolve) => {
            setDialogOptions(options);
            setResolvePromise(() => resolve);
            setIsConfirmOpen(true);
        });
    }, []);

    const handleConfirm = useCallback(() => {
        setIsConfirmOpen(false);
        if (resolvePromise) {
            resolvePromise(true);
            setResolvePromise(null);
        }
    }, [resolvePromise]);

    const handleCancel = useCallback(() => {
        setIsConfirmOpen(false);
        if (resolvePromise) {
            resolvePromise(false);
            setResolvePromise(null);
        }
    }, [resolvePromise]);

    return {
        isConfirmOpen,
        dialogOptions,
        showConfirmDialog,
        handleConfirm,
        handleCancel,
    };
};
