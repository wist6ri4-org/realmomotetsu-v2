import { useState, useCallback } from "react";

/**
 * カスタムフック: 数値入力の管理の戻り値の型定義
 * @property {number} value - 現在の数値
 * @property {Function} setValue - 数値を更新する関数
 * @property {Function} handleChange - 入力変更を処理する関数
 * @property {Function} reset - 数値を初期値にリセットする関数
 */
interface UseNumberInputReturn {
    value: number;
    setValue: (newValue: number) => void;
    handleChange: (
        event:
            | number
            | React.ChangeEvent<HTMLInputElement>
            | (Event & { target: { value: unknown; name: string } })
            | null
    ) => void;
    reset: () => void;
}

/**
 * カスタムフック: 数値入力の管理
 * @param {number} initialValue - 初期値（デフォルトは0）
 * @return {UseNumberInputReturn} - 数値入力の管理に必要な関数と状態
 */
export const useNumberInput = (initialValue: number = 0): UseNumberInputReturn => {
    const [value, setValue] = useState<number>(initialValue);

    /**
     * 入力変更を処理する関数
     * @param {number | React.ChangeEvent<HTMLInputElement> | null} event - 入力イベントまたは数値
     */
    const handleChange = useCallback(
        (
            event:
                | number
                | React.ChangeEvent<HTMLInputElement>
                | (Event & { target: { value: unknown; name: string } })
                | null
        ) => {
            if (typeof event === "number") {
                setValue(event);
            } else if (event === null) {
                setValue(0);
            } else {
                const newValue = Number(event.target.value);
                console.log("入力された値:", newValue);
                setValue(newValue);
            }
        },
        []
    );

    /**
     * 数値を初期値にリセットする関数
     */
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
