import React, { useId, useMemo } from "react";
import {
    Autocomplete,
    TextField,
    FormControl,
    FormHelperText,
    Box,
} from "@mui/material";

/**
 * オートコンプリートのオプション型定義
 * @property {string | number} value - オプションの値
 * @property {string} label - オプションのラベル
 * @property {boolean} [disabled] - オプションが無効かどうか
 * @property {string[]} [searchKeys] - 追加の検索キー（かな、ローマ字など）
 */
export interface AutoCompleteOption {
    value: string | number;
    label: string;
    disabled?: boolean;
    searchKeys?: string[];
}

/**
 * カスタムオートコンプリートのプロパティ型定義
 * @property {AutoCompleteOption[]} options - オプションリスト
 * @property {string} [color] - カラー
 * @property {string} [size] - サイズ
 * @property {string} [variant] - テキストフィールドのバリアント
 * @property {boolean} [fullWidth] - 幅を全体にするかどうか
 * @property {string} [label] - ラベル
 * @property {string} [helperText] - ヘルパーテキスト
 * @property {boolean} [error] - エラーステータス
 * @property {string} [placeholder] - プレースホルダーテキスト
 * @property {boolean} [loading] - ローディング状態
 * @property {boolean} [disabled] - 無効化するかどうか
 * @property {string | number} [value] - 選択されている値（optionのvalue）
 * @property {function} [onChange] - 値が変更されたときのハンドラー
 * @property {boolean} [required] - 必須かどうか
 * @property {string} [noOptionsText] - オプションがないときのテキスト
 * @property {object} [sx] - スタイルオブジェクト
 */
interface CustomAutoCompleteProps {
    options: AutoCompleteOption[];
    color?:
    | "primary"
    | "secondary"
    | "success"
    | "error"
    | "warning"
    | "info"
    | "light"
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
        event: React.ChangeEvent<HTMLInputElement> | (Event & { target: { value: unknown; name: string } }),
        child?: React.ReactNode
    ) => void;
    required?: boolean;
    noOptionsText?: string;
    sx?: object;
}

/**
 * カスタムオートコンプリートコンポーネント
 * @param {CustomAutoCompleteProps} props - カスタムオートコンプリートのプロパティ
 * @returns {JSX.Element} - カスタムオートコンプリートコンポーネント
 */
export const CustomAutoComplete: React.FC<CustomAutoCompleteProps> = ({
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
    required = false,
    noOptionsText = "該当なし",
    sx,
}: CustomAutoCompleteProps): React.JSX.Element => {
    const id = useId();

    // MUIの標準カラーのみを許可
    const standardColor = ["light", "team1", "team2", "team3", "team4"].includes(color)
        ? "primary"
        : (color as "primary" | "secondary" | "success" | "error" | "warning" | "info");

    // valueからAutoCompleteOptionを逆引き
    const selectedOption = useMemo(() => {
        if (value === undefined || value === "") return null;
        return options.find((opt) => opt.value === value) ?? null;
    }, [value, options]);

    return (
        <Box sx={{ width: "stretch" }}>
            <FormControl
                variant={variant}
                size={size}
                fullWidth={fullWidth}
                error={error}
                disabled={disabled || loading}
                sx={sx}
            >
                <Autocomplete
                    id={`custom-autocomplete-${id}`}
                    options={options}
                    value={selectedOption}
                    disableClearable={required}
                    onChange={(_event, newValue) => {
                        if (onChange) {
                            const syntheticEvent = {
                                target: { value: newValue?.value ?? "", name: "" },
                            } as React.ChangeEvent<HTMLInputElement>;
                            onChange(syntheticEvent);
                        }
                    }}
                    getOptionLabel={(option) => option.label}
                    getOptionDisabled={(option) => !!option.disabled}
                    isOptionEqualToValue={(option, val) => option.value === val.value}
                    filterOptions={(opts, state) => {
                        const input = state.inputValue.toLowerCase();
                        if (!input) return opts;
                        return opts.filter((option) => {
                            if (option.label.toLowerCase().includes(input)) return true;
                            return (
                                option.searchKeys?.some((key) =>
                                    key.toLowerCase().includes(input)
                                ) ?? false
                            );
                        });
                    }}
                    size={size}
                    fullWidth={fullWidth}
                    disabled={disabled || loading}
                    loading={loading}
                    loadingText="Loading..."
                    noOptionsText={noOptionsText}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label={label}
                            variant={variant}
                            color={standardColor}
                            placeholder={placeholder}
                            error={error}
                            required={required}
                            slotProps={{
                                htmlInput: {
                                    ...params.inputProps,
                                    required: required && !selectedOption,
                                },
                                input: {
                                    ...params.InputProps,
                                },
                                inputLabel: {
                                    ...params.InputLabelProps,
                                },
                            }}
                        />
                    )}
                />
                {helperText && <FormHelperText>{helperText}</FormHelperText>}
            </FormControl>
        </Box>
    );
};

export default CustomAutoComplete;