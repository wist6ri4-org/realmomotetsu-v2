import React, { useId } from "react";
import {
    Select as MuiSelect,
    FormControl,
    InputLabel,
    MenuItem,
    SelectProps as MuiSelectProps,
    FormHelperText,
    Box,
} from "@mui/material";

/**
 * セレクトボックスのオプション型定義
 * @property {string | number} value - オプションの値
 * @property {string} label - オプションのラベル
 * @property {boolean} [disabled] - オプションが無効かどうか
 */
export interface SelectOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

/**
 * カスタムセレクトボックスのプロパティ型定義
 * @property {SelectOption[]} [options] - セレクトボックスのオプションリスト
 * @property {string} [color] - セレクトボックスの色
 * @property {string} [size] - セレクトボックスのサイズ
 * @property {string} [variant] - セレクトボックスのバリアント
 * @property {boolean} [fullWidth] - セレクトボックスの幅を全体にするかどうか
 * @property {string} [label] - セレクトボックスのラベル
 * @property {string} [helperText] - セレクトボックスのヘルパーテキスト
 * @property {boolean} [error] - エラーステータス
 * @property {string} [placeholder] - プレースホルダーテキスト
 * @property {boolean} [loading] - ローディング状態
 * @property {boolean} [disabled] - セレクトボックスを無効化するかどうか
 * @property {string | number} [value] - 選択されている値
 * @property {function} [onChange] - 値が変更されたときのハンドラー
 * @property {object} [sx] - スタイルオブジェクト
 */
interface CustomSelectProps extends Omit<MuiSelectProps, "color" | "size"> {
    options: SelectOption[];
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
    value?: string | number;
    onChange?: (
        event:
            | React.ChangeEvent<HTMLInputElement>
            | (Event & { target: { value: unknown; name: string } }),
        child?: React.ReactNode
    ) => void;
}

/**
 * カスタムセレクトボックスコンポーネント
 * @param props - カスタムセレクトボックスのプロパティ
 * @param props.options - セレクトボックスのオプションリスト
 * @param props.color - セレクトボックスの色
 * @param props.size - セレクトボックスのサイズ
 * @param props.variant - セレクトボックスのバリアント
 * @param props.fullWidth - セレクトボックスの幅を全体にするかどうか
 * @param props.label - セレクトボックスのラベル
 * @param props.helperText - セレクトボックスのヘルパーテキスト
 * @param props.error - エラーステータス
 * @param props.placeholder - プレースホルダーテキスト
 * @param props.loading - ローディング状態
 * @param props.disabled - セレクトボックスを無効化するかどうか
 * @param props.value - 選択されている値
 * @param props.onChange - 値が変更されたときのハンドラー
 * @param props.sx - スタイルオブジェクト
 * @returns {JSX.Element} - カスタムセレクトボックスコンポーネント
 */
export const CustomSelect: React.FC<CustomSelectProps> = ({
    options,
    color = "primary",
    size = "medium",
    variant = "standard",
    fullWidth = false,
    label,
    helperText,
    error = false,
    placeholder,
    loading = false,
    disabled,
    value,
    onChange,
    sx,
    ...props
}): React.JSX.Element => {
    const id = useId();
    const labelId = `custom-select-label-${id}`;

    // MUIの標準カラーのみを許可
    const standardColor = ["team1", "team2", "team3", "team4"].includes(color)
        ? "primary"
        : (color as "primary" | "secondary" | "success" | "error" | "warning" | "info");

    return (
        <>
            <Box sx={{ width: "stretch" }}>
                <FormControl
                    variant={variant}
                    size={size}
                    fullWidth={fullWidth}
                    error={error}
                    disabled={disabled || loading}
                    sx={sx}
                >
                    {label && (
                        <InputLabel id={labelId} color={standardColor}>
                            {label}
                        </InputLabel>
                    )}
                    <MuiSelect
                        labelId={label ? labelId : undefined}
                        label={label}
                        color={standardColor}
                        value={value}
                        onChange={onChange}
                        displayEmpty={!!placeholder}
                        sx={{
                            "&:disabled": {
                                opacity: 0.6,
                            },
                        }}
                        {...props}
                    >
                        {placeholder && (
                            <MenuItem value="" disabled>
                                <em>{placeholder}</em>
                            </MenuItem>
                        )}
                        {loading ? (
                            <MenuItem value="" disabled>
                                <em>Loading...</em>
                            </MenuItem>
                        ) : (
                            options.map((option) => (
                                <MenuItem
                                    key={option.value}
                                    value={option.value}
                                    disabled={option.disabled}
                                >
                                    {option.label}
                                </MenuItem>
                            ))
                        )}
                    </MuiSelect>
                    {helperText && <FormHelperText>{helperText}</FormHelperText>}
                </FormControl>
            </Box>
        </>
    );
};

export default CustomSelect;
