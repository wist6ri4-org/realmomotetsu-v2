import React, { useId, forwardRef, useRef } from "react";
import { FormControl, FormHelperText, Box, InputLabel } from "@mui/material";
import { NumberField } from "@base-ui-components/react/number-field";
import { Add, Remove } from "@mui/icons-material";

/**
 * カスタム数値入力のプロパティ型定義
 * @property {string} [color] - 入力フィールドの色
 * @property {string} [size] - 入力フィールドのサイズ
 * @property {string} [variant] - 入力フィールドのバリアント
 * @property {boolean} [fullWidth] - 入力フィールドの幅を全体にするかどうか
 * @property {string} [label] - 入力フィールドのラベル
 * @property {string} [helperText] - 入力フィールドのヘルパーテキスト
 * @property {boolean} [error] - エラーステータス
 * @property {string} [placeholder] - プレースホルダーテキスト
 * @property {boolean} [loading] - ローディング状態
 * @property {boolean} [disabled] - 入力フィールドを無効化するかどうか
 * @property {number} [value] - 入力されている値
 * @property {number} [min] - 最小値
 * @property {number} [max] - 最大値
 * @property {number} [step] - ステップ値
 * @property {boolean} [showSteppers] - ステッパーボタンを表示するかどうか
 * @property {function} [onChange] - 値が変更されたときのハンドラー
 * @property {function} [onBlur] - フォーカスが外れたときのハンドラー
 * @property {object} [sx] - スタイルオブジェクト
 */
interface CustomNumberInputProps {
    color?:
        | "primary"
        | "secondary"
        | "success"
        | "error"
        | "warning"
        | "info"
        | "team1"
        | "team2"
        | "team3"
        | "team4";
    size?: "small" | "medium";
    variant?: "outlined" | "filled" | "standard";
    fullWidth?: boolean;
    label?: string;
    helperText?: string;
    error?: boolean;
    placeholder?: string;
    loading?: boolean;
    disabled?: boolean;
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    showSteppers?: boolean;
    onChange?: (
        event:
            | React.ChangeEvent<HTMLInputElement>
            | (Event & { target: { value: unknown; name: string } })
            | number
            | null
    ) => void;
    onBlur?: () => void;
    sx?: object;
}

/**
 * カスタム数値入力コンポーネント
 * @param props - カスタム数値入力のプロパティ
 * @param props.color - 入力フィールドの色
 * @param props.size - 入力フィールドのサイズ
 * @param props.variant - 入力フィールドのバリアント
 * @param props.fullWidth - 入力フィールドの幅を全体にするかどうか
 * @param props.label - 入力フィールドのラベル
 * @param props.helperText - 入力フィールドのヘルパーテキスト
 * @param props.error - エラーステータス
 * @param props.placeholder - プレースホルダーテキスト
 * @param props.loading - ローディング状態
 * @param props.disabled - 入力フィールドを無効化するかどうか
 * @param props.value - 入力されている値
 * @param props.min - 最小値
 * @param props.max - 最大値
 * @param props.step - ステップ値
 * @param props.showSteppers - ステッパーボタンを表示するかどうか
 * @param props.onChange - 値が変更されたときのハンドラー
 * @param props.onBlur - フォーカスが外れたときのハンドラー
 * @param props.sx - スタイルオブジェクト
 * @param ref - input要素への参照
 * @returns {JSX.Element} - カスタム数値入力コンポーネント
 */
export const CustomNumberInput = forwardRef<HTMLInputElement, CustomNumberInputProps>(
    (
        {
            color = "primary",
            size = "small",
            variant = "outlined",
            fullWidth = false,
            label,
            helperText,
            error = false,
            placeholder,
            loading = false,
            disabled,
            value,
            min,
            max,
            step = 1,
            showSteppers = false,
            onChange,
            onBlur,
            sx,
        },
        ref
    ): React.JSX.Element => {
        const id = useId();
        const labelId = `custom-number-input-label-${id}`;
        const lastValueRef = useRef<number | null>(value ?? null);

        // MUIの標準カラーのみを許可
        const standardColor = ["team1", "team2", "team3", "team4"].includes(color)
            ? "primary"
            : (color as "primary" | "secondary" | "success" | "error" | "warning" | "info");

        return (
            <>
                <Box sx={{ width: fullWidth ? "100%" : "auto" }}>
                    <FormControl
                        error={error}
                        disabled={disabled || loading}
                        fullWidth={fullWidth}
                        variant={variant}
                    >
                        {label && (
                            <InputLabel
                                htmlFor={id}
                                id={labelId}
                                shrink={true}
                                sx={{
                                    color: error ? "error.main" : `${standardColor}.main`,
                                    fontSize: size === "small" ? "1.4rem" : "1.6rem",
                                    marginBottom: 1,
                                    position: "static",
                                    transform: "none",
                                }}
                            >
                                {label}
                            </InputLabel>
                        )}
                        <NumberField.Root
                            value={value}
                            min={min}
                            max={max}
                            step={step}
                            onValueChange={(newValue: number | null) => {
                                // 前回の値と同じ場合は処理をスキップ
                                if (lastValueRef.current === newValue) {
                                    return;
                                }
                                lastValueRef.current = newValue;

                                if (onChange) {
                                    const syntheticEvent = {
                                        target: {
                                            value: newValue,
                                            name: id,
                                        },
                                    } as Event & { target: { value: unknown; name: string } };
                                    onChange(syntheticEvent);
                                }
                            }}
                            disabled={disabled || loading}
                            style={{
                                width: fullWidth ? "100%" : "auto",
                                ...sx,
                            }}
                        >
                            <NumberField.Group
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    border: `1px solid ${error ? "#d32f2f" : "#ccc"}`,
                                    borderRadius: "4px",
                                    padding: "0",
                                    backgroundColor: "#fff",
                                }}
                            >
                                {showSteppers && (
                                    <NumberField.Decrement
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            height: "stretch",
                                            width: "5rem",
                                        }}
                                    >
                                        <Remove sx={{ fontSize: "2.5rem" }} />
                                    </NumberField.Decrement>
                                )}
                                <NumberField.Input
                                    ref={ref}
                                    id={id}
                                    placeholder={loading ? "Loading..." : placeholder}
                                    onBlur={onBlur}
                                    style={{
                                        flex: 1,
                                        border: "none",
                                        outline: "none",
                                        padding: size === "small" ? "4px 8px" : "8px 12px",
                                        fontSize: size === "small" ? "1.8rem" : "2.2rem",
                                        fontFamily: "inherit",
                                        backgroundColor: "transparent",
                                        width: size === "small" ? "16rem" : "20rem",
                                    }}
                                />
                                {showSteppers && (
                                    <NumberField.Increment
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            height: "stretch",
                                            width: "5rem",
                                        }}
                                    >
                                        <Add sx={{ fontSize: "2.5rem" }} />
                                    </NumberField.Increment>
                                )}
                            </NumberField.Group>
                        </NumberField.Root>
                        {helperText && (
                            <FormHelperText
                                sx={{
                                    fontSize: "0.75rem",
                                    marginTop: 0.5,
                                }}
                            >
                                {loading ? "Loading..." : helperText}
                            </FormHelperText>
                        )}
                    </FormControl>
                </Box>
            </>
        );
    }
);

// displayNameを追加（forwardRefの要件）
CustomNumberInput.displayName = "CustomNumberInput";

// デフォルトエクスポート
export default CustomNumberInput;
