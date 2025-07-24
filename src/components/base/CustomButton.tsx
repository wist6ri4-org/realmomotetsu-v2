import React from "react";
import { Button as MuiButton, ButtonProps as MuiButtonProps } from "@mui/material";

/**
 * カスタムボタンのプロパティ型定義
 * @property {string} [color] - ボタンの色
 * @property {string} [size] - ボタンのサイズ
 * @property {string} [variant] - ボタンのバリアント
 * @property {boolean} [fullWidth] - ボタンの幅を全体にするかどうか
 * @property {boolean} [loading] - ローディング状態
 */

/**
 * カスタムボタンのプロパティ
 * @param {React.ReactNode} children - ボタンの子要素
 * @param {string} [color] - ボタンの色
 * @param {string} [size] - ボタンのサイズ
 * @param {string} [variant] - ボタンのバリアント
 * @param {boolean} [fullWidth] - ボタンの幅を全体にするかどうか
 * @param {boolean} [loading] - ローディング状態
 * @param {boolean} [disabled] - ボタンを無効化するかどうか
 */
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
 * @param props - カスタムボタンのプロパティ
 * @param props.children - ボタンの子要素
 * @param props.color - ボタンの色
 * @param props.size - ボタンのサイズ
 * @param props.variant - ボタンのバリアント
 * @param props.fullWidth - ボタンの幅を全体にするかどうか
 * @param props.loading - ローディング状態
 * @param props.disabled - ボタンを無効化するかどうか
 * @param props.sx - スタイルのカスタマイズ
 * @returns {JSX.Element} - カスタムボタンコンポーネント
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
}): React.JSX.Element => {
    return (
        <>
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
        </>
    );
};

export default CustomButton;
