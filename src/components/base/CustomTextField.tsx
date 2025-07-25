import React, { useId } from "react";
import {
    TextField as MuiTextField,
    TextFieldProps as MuiTextFieldProps,
    InputAdornment,
    IconButton,
    Box,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

/**
 * カスタムテキストフィールドのプロパティ型定義
 * @property {string} [color] - テキストフィールドの色
 * @property {string} [size] - テキストフィールドのサイズ
 * @property {string} [variant] - テキストフィールドのバリアント
 * @property {boolean} [fullWidth] - テキストフィールドの幅を全体にするかどうか
 * @property {string} [label] - テキストフィールドのラベル
 * @property {string} [helperText] - テキストフィールドのヘルパーテキスト
 * @property {boolean} [error] - エラーステータス
 * @property {string} [placeholder] - プレースホルダーテキスト
 * @property {boolean} [loading] - ローディング状態
 * @property {boolean} [disabled] - テキストフィールドを無効化するかどうか
 * @property {string} [value] - テキストフィールドの値
 * @property {function} [onChange] - 値が変更されたときのハンドラー
 * @property {string} [type] - インプットタイプ
 * @property {boolean} [multiline] - 複数行対応するかどうか
 * @property {number} [rows] - 複数行の場合の行数
 * @property {number} [maxRows] - 複数行の場合の最大行数
 * @property {boolean} [showPasswordToggle] - パスワード表示切り替えボタンを表示するかどうか
 * @property {React.ReactNode} [startAdornment] - 開始装飾
 * @property {React.ReactNode} [endAdornment] - 終了装飾
 * @property {object} [sx] - スタイルオブジェクト
 */
interface CustomTextFieldProps extends Omit<MuiTextFieldProps, "color" | "size"> {
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
    value?: string;
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
    multiline?: boolean;
    rows?: number;
    maxRows?: number;
    showPasswordToggle?: boolean;
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
}

/**
 * カスタムテキストフィールドコンポーネント
 * @param props - カスタムテキストフィールドのプロパティ
 * @param props.color - テキストフィールドの色
 * @param props.size - テキストフィールドのサイズ
 * @param props.variant - テキストフィールドのバリアント
 * @param props.fullWidth - テキストフィールドの幅を全体にするかどうか
 * @param props.label - テキストフィールドのラベル
 * @param props.helperText - テキストフィールドのヘルパーテキスト
 * @param props.error - エラーステータス
 * @param props.placeholder - プレースホルダーテキスト
 * @param props.loading - ローディング状態
 * @param props.disabled - テキストフィールドを無効化するかどうか
 * @param props.value - テキストフィールドの値
 * @param props.onChange - 値が変更されたときのハンドラー
 * @param props.type - インプットタイプ
 * @param props.multiline - 複数行対応するかどうか
 * @param props.rows - 複数行の場合の行数
 * @param props.maxRows - 複数行の場合の最大行数
 * @param props.showPasswordToggle - パスワード表示切り替えボタンを表示するかどうか
 * @param props.startAdornment - 開始装飾
 * @param props.endAdornment - 終了装飾
 * @param props.sx - スタイルオブジェクト
 * @returns {JSX.Element} - カスタムテキストフィールドコンポーネント
 */
export const CustomTextField: React.FC<CustomTextFieldProps> = ({
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
    type = "text",
    multiline = false,
    rows,
    maxRows,
    showPasswordToggle = false,
    startAdornment,
    endAdornment,
    sx,
    ...props
}): React.JSX.Element => {
    const id = useId();
    const [showPassword, setShowPassword] = React.useState(false);

    // MUIの標準カラーのみを許可
    const standardColor = ["team1", "team2", "team3", "team4"].includes(color)
        ? "primary"
        : (color as "primary" | "secondary" | "success" | "error" | "warning" | "info");

    // パスワード表示切り替えの処理
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
    };

    // パスワードフィールドの場合のtype調整
    const inputType =
        showPasswordToggle && type === "password" ? (showPassword ? "text" : "password") : type;

    // エンドアドーンメントの組み立て
    const finalEndAdornment = React.useMemo(() => {
        if (showPasswordToggle && type === "password") {
            const passwordToggle = (
                <InputAdornment position="end">
                    <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        size={size}
                    >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                    {endAdornment}
                </InputAdornment>
            );
            return passwordToggle;
        }
        return endAdornment ? (
            <InputAdornment position="end">{endAdornment}</InputAdornment>
        ) : undefined;
    }, [showPasswordToggle, type, showPassword, endAdornment, size]);

    // スタートアドーンメントの組み立て
    const finalStartAdornment = startAdornment ? (
        <InputAdornment position="start">{startAdornment}</InputAdornment>
    ) : undefined;

    return (
        <Box sx={{ width: "stretch" }}>
            <MuiTextField
                id={id}
                variant={variant}
                size={size}
                color={standardColor}
                fullWidth={fullWidth}
                label={label}
                helperText={loading ? "Loading..." : helperText}
                error={error}
                placeholder={placeholder}
                disabled={disabled || loading}
                value={value}
                onChange={onChange}
                type={inputType}
                multiline={multiline}
                rows={rows}
                maxRows={maxRows}
                slotProps={{
                    input: {
                        startAdornment: finalStartAdornment,
                        endAdornment: finalEndAdornment,
                    },
                }}
                sx={{
                    "&:disabled": {
                        opacity: 0.6,
                    },
                    ...sx,
                }}
                {...props}
            />
        </Box>
    );
};

export default CustomTextField;
