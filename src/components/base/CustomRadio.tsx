import React, { useId } from "react";
import {
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio as MuiRadio,
    FormHelperText,
    Box,
    RadioGroupProps as MuiRadioGroupProps,
} from "@mui/material";

/**
 * ラジオボタンのオプション型定義
 * @property {string | number} value - オプションの値
 * @property {string} label - オプションのラベル
 * @property {boolean} [disabled] - オプションが無効かどうか
 */
export interface RadioOption {
    value: string | number;
    label: string;
    disabled?: boolean;
}

/**
 * カスタムラジオボタンのプロパティ型定義
 * @property {RadioOption[]} options - ラジオボタンのオプションリスト
 * @property {string} [color] - ラジオボタンの色
 * @property {string} [size] - ラジオボタンのサイズ
 * @property {string} [row] - ラジオボタンを横に並べるかどうか
 * @property {string} [label] - ラジオボタングループのラベル
 * @property {string} [helperText] - ラジオボタングループのヘルパーテキスト
 * @property {boolean} [error] - エラーステータス
 * @property {boolean} [loading] - ローディング状態
 * @property {boolean} [disabled] - ラジオボタンを無効化するかどうか
 * @property {string | number} [value] - 選択されている値
 * @property {function} [onChange] - 値が変更されたときのハンドラー
 * @property {object} [sx] - スタイルオブジェクト
 */
interface CustomRadioProps extends Omit<MuiRadioGroupProps, "color" | "size"> {
    options: RadioOption[];
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
    row?: boolean;
    label?: string;
    helperText?: string;
    error?: boolean;
    loading?: boolean;
    disabled?: boolean;
    value?: string | number;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>, value: string) => void;
}

/**
 * カスタムラジオボタンコンポーネント
 * @param {CustomRadioProps} props - カスタムラジオボタンのプロパティ
 * @returns {JSX.Element} - カスタムラジオボタンコンポーネント
 */
export const CustomRadio: React.FC<CustomRadioProps> = ({
    options,
    color = "primary",
    size = "medium",
    row = false,
    label,
    helperText,
    error = false,
    loading = false,
    disabled,
    value,
    onChange,
    sx,
    ...props
}: CustomRadioProps): React.JSX.Element => {
    const id = useId();
    const labelId = `custom-radio-label-${id}`;

    // MUIの標準カラーのみを許可
    const standardColor = ["team1", "team2", "team3", "team4"].includes(color)
        ? "primary"
        : (color as "primary" | "secondary" | "success" | "error" | "warning" | "info");

    return (
        <>
            <Box sx={{ width: "stretch" }}>
                <FormControl
                    component="fieldset"
                    error={error}
                    disabled={disabled || loading}
                    sx={sx}
                >
                    {label && (
                        <FormLabel
                            id={labelId}
                            component="legend"
                            color={standardColor}
                            sx={{ fontSize: size === "small" ? "1.4rem" : "1.6rem" }}
                        >
                            {label}
                        </FormLabel>
                    )}
                    <RadioGroup
                        aria-labelledby={label ? labelId : undefined}
                        value={value}
                        onChange={onChange}
                        row={row}
                        sx={{
                            "&.Mui-disabled": {
                                opacity: 0.6,
                            },
                        }}
                        {...props}
                    >
                        {loading ? (
                            <FormControlLabel
                                value=""
                                control={<MuiRadio />}
                                label="Loading..."
                                disabled
                            />
                        ) : (
                            options.map((option) => (
                                <FormControlLabel
                                    key={option.value}
                                    value={option.value}
                                    control={<MuiRadio color={standardColor} size={size} />}
                                    label={option.label}
                                    disabled={option.disabled || disabled || loading}
                                />
                            ))
                        )}
                    </RadioGroup>
                    {helperText && <FormHelperText>{helperText}</FormHelperText>}
                </FormControl>
            </Box>
        </>
    );
};

export default CustomRadio;
