import { colors } from "@/theme";

// カラータイプ定義
export type ColorPalette = {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
};

export type ColorNames = "primary" | "secondary" | "success" | "error" | "warning" | "info";
export type ColorVariants = keyof ColorPalette;

// カラーユーティリティ関数
export const getColor = (colorName: ColorNames, variant: ColorVariants = "main"): string => {
    const colorObject = colors[colorName] as ColorPalette;
    return colorObject?.[variant] || colors.primary.main;
};

// CSS変数として使用するためのカラーパレット
export const cssVariables = {
    "--color-primary": colors.primary.main,
    "--color-primary-light": colors.primary.light,
    "--color-primary-dark": colors.primary.dark,
    "--color-secondary": colors.secondary.main,
    "--color-secondary-light": colors.secondary.light,
    "--color-secondary-dark": colors.secondary.dark,
    "--color-success": colors.success.main,
    "--color-error": colors.error.main,
    "--color-warning": colors.warning.main,
    "--color-info": colors.info.main,
    "--color-text-primary": colors.text.primary,
    "--color-text-secondary": colors.text.secondary,
    "--color-background": colors.background.default,
    "--color-background-paper": colors.background.paper,
} as const;

// 使用例のためのカラーマップ
export const colorMap = {
    primary: colors.primary.main,
    secondary: colors.secondary.main,
    success: colors.success.main,
    error: colors.error.main,
    warning: colors.warning.main,
    info: colors.info.main,
} as const;

export { colors };
export default colors;
