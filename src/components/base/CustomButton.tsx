import React from "react";
import { Button as MuiButton, ButtonProps as MuiButtonProps } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@/theme";

// カスタムボタンのprops型定義
interface CustomButtonProps extends Omit<MuiButtonProps, "color" | "size"> {
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
    size?: "small" | "medium" | "large";
    variant?: "contained" | "outlined" | "text";
    fullWidth?: boolean;
    loading?: boolean;
}

/**
 * カスタムボタンコンポーネント
 * @param {CustomButtonProps} props - ボタンのプロパティ
 * @param {React.ReactNode} props.children - ボタン内に表示するコンテンツ
 * @param {string} [props.color="primary"] - ボタンの色
 * @param {string} [props.size="medium"] - ボタンのサイズ
 * @param {string} [props.variant="contained"] - ボタンのバリアント
 * @param {boolean} [props.fullWidth=false] - フル幅で表示する
 * @param {boolean} [props.loading=false] - ローディング状態かどうか
 * @param {boolean} [props.disabled=false] - ボタンを無効化する
 * @param {object} [props.sx] - スタイルオブジェクト
 * @param {React.HTMLAttributes<HTMLButtonElement>} [props] - その他のHTML属性
 */
export const CustomButton: React.FC<CustomButtonProps> = ({
    children,
    color = "primary",
    size = "medium",
    variant = "contained",
    fullWidth = false,
    loading = false,
    disabled,
    sx,
    ...props
}) => {
    return (
        <ThemeProvider theme={theme}>
            <MuiButton
                color={color}
                size={size}
                variant={variant}
                fullWidth={fullWidth}
                disabled={disabled || loading}
                sx={{
                    "&:disabled": {
                        opacity: 0.6,
                    },
                    ...sx,
                }}
                {...props}
            >
                {loading ? "Loading..." : children}
            </MuiButton>
        </ThemeProvider>
    );
};

// デフォルトエクスポート
export default CustomButton;
