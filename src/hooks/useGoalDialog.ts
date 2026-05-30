import { useState, useCallback } from "react";

/**
 * カスタムフック: ゴールダイアログの管理
 * @return {object} - ゴールダイアログの管理に必要な関数と状態
 * @property {boolean} isGoalDialogOpen - ゴールダイアログの開閉状態
 * @property {() => Promise<void>} showGoalDialog - ゴールダイアログを表示する関数
 * @property {() => void} handleClose - ゴールダイアログを閉じる処理
 */
export const useGoalDialog = (): {
    isGoalDialogOpen: boolean;
    showGoalDialog: () => Promise<void>;
    handleClose: () => void;
} => {
    const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
    const [resolvePromise, setResolvePromise] = useState<(() => void) | null>(null);

    /**
     * ゴールダイアログを表示する関数
     */
    const showGoalDialog = useCallback((): Promise<void> => {
        return new Promise<void>((resolve) => {
            setResolvePromise(() => resolve);
            setIsGoalDialogOpen(true);
        });
    }, []);

    /**
     * ゴールダイアログを閉じる処理
     */
    const handleClose = useCallback(() => {
        setIsGoalDialogOpen(false);
        if (resolvePromise) {
            resolvePromise();
            setResolvePromise(null);
        }
    }, [resolvePromise]);

    return {
        isGoalDialogOpen,
        showGoalDialog,
        handleClose,
    };
};
