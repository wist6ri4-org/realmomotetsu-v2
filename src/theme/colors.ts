import { colors } from "@/theme";

// カラータイプ定義
export type ColorPalette = {
    main: string;
    light: string;
    dark: string;
    contrastText: string;
};

export type ColorNames =
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
    "--color-light": colors.light.main,
    "--color-light-light": colors.light.light,
    "--color-light-dark": colors.light.dark,
    "--color-team1": colors.team1.main,
    "--color-team1-dark": colors.team1.dark,
    "--color-team2": colors.team2.main,
    "--color-team2-dark": colors.team2.dark,
    "--color-team3": colors.team3.main,
    "--color-team3-dark": colors.team3.dark,
    "--color-team4": colors.team4.main,
    "--color-team4-dark": colors.team4.dark,
    "--color-text-primary": colors.text.primary,
    "--color-text-secondary": colors.text.secondary,
    "--color-background": colors.background.default,
    "--color-background-paper": colors.background.paper,
} as const;

export { colors };
export default colors;
