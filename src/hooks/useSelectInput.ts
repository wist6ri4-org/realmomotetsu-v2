import { useState, useCallback } from "react";

/**
 * カスタムフック: 選択入力の管理の戻り値の型定義
 * @property {string} value - 現在の選択値
 * @property {Function} setValue - 選択値を更新する関数
 * @property {Function} handleChange - 入力変更を処理する関数
 * @property {Function} reset - 選択値を初期値にリセットする関数
 */
interface UseSelectInputReturn {
    value: string;
    setValue: (newValue: string) => void;
    handleChange: (
        event:
            | React.ChangeEvent<HTMLInputElement>
            | (Event & { target: { value: unknown; name: string } })
    ) => void;
    reset: () => void;
}

/**
 * カスタムフック: 選択入力の管理
 * @param {string} initialValue - 初期値（デフォルトは空文字列）
 * @return {UseSelectInputReturn} - 選択入力の管理に必要な関数と状態
 */
export const useSelectInput = (initialValue: string = ""): UseSelectInputReturn => {
    const [value, setValue] = useState<string>(initialValue);

    const handleChange = useCallback(
        (
            event:
                | React.ChangeEvent<HTMLInputElement>
                | (Event & { target: { value: unknown; name: string } })
        ) => {
            const newValue = event.target.value as string;
            setValue(newValue);
            console.log("選択された値:", newValue);
        },
        []
    );

    const reset = useCallback(() => {
        setValue(initialValue);
    }, [initialValue]);

    return {
        value,
        setValue,
        handleChange,
        reset,
    };
};
