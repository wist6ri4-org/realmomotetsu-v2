import { useState, useCallback } from "react";

/**
 * カスタムフック: ゴールダイアログの管理
 * @return {object} - ゴールダイアログの管理に必要な関数と状態
 * @property {boolean} isGoalDialogOpen - ゴールダイアログの開閉状態
 * @property {() => Promise<void>} showGoalDialog - ゴールダイアログを表示する関数
 * @property {() => void} handleGoalCancel - ゴールダイアログのキャンセル処理
 * @property {() => void} handlePurchaseStation - ゴールダイアログの購入処理
 */
export const useGoalDialog = (): {
    isGoalDialogOpen: boolean;
    showGoalDialog: () => Promise<void>;
    handleGoalCancel: () => void;
    handlePurchaseStation: () => void;
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
     * ゴールダイアログのキャンセル処理
     */
    const handleGoalCancel = useCallback(() => {
        setIsGoalDialogOpen(false);
        if (resolvePromise) {
            resolvePromise();
            setResolvePromise(null);
        }
    }, [resolvePromise]);

    // TODO [TSK-56] 物件購入ページへの遷移処理を実装する
    /**
     * ゴールダイアログの購入処理
     */
    const handlePurchaseStation = useCallback(() => {
        setIsGoalDialogOpen(false);
        if (resolvePromise) {
            resolvePromise();
            setResolvePromise(null);
        }
    }, [resolvePromise]);

    return {
        isGoalDialogOpen,
        showGoalDialog,
        handleGoalCancel,
        handlePurchaseStation,
    };
};
