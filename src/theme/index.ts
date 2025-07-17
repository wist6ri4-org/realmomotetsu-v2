import { createTheme } from "@mui/material/styles";
import "./types"; // 型定義をインポート

// カラーパレット定義
export const colors = {
    primary: {
        main: "#1976d2",
        light: "#42a5f5",
        dark: "#1565c0",
        contrastText: "#ffffff",
    },
    secondary: {
        main: "#dc004e",
        light: "#ff5983",
        dark: "#9a0036",
        contrastText: "#ffffff",
    },
    success: {
        main: "#2e7d32",
        light: "#4caf50",
        dark: "#1b5e20",
        contrastText: "#ffffff",
    },
    error: {
        main: "#d32f2f",
        light: "#ef5350",
        dark: "#c62828",
        contrastText: "#ffffff",
    },
    warning: {
        main: "#ed6c02",
        light: "#ff9800",
        dark: "#e65100",
        contrastText: "#ffffff",
    },
    info: {
        main: "#0288d1",
        light: "#03a9f4",
        dark: "#01579b",
        contrastText: "#ffffff",
    },
    team1: {
        main: "rgb(0 ,89 ,255)",
        dark: "rgb(0 ,60 ,180)",
        contrastText: "#ffffff",
    },
    team2: {
        main: "rgb(241, 27, 27)",
        dark: "rgb(160, 0, 0)",
        contrastText: "#ffffff",
    },
    team3: {
        main: "rgb(231, 169, 35)",
        dark: "rgb(180, 120, 0)",
        contrastText: "#ffffff",
    },
    team4: {
        main: "rgb(3, 165, 11)",
        dark: "rgb(0, 110, 0)",
        contrastText: "#ffffff",
    },
    grey: {
        50: "#fafafa",
        100: "#f5f5f5",
        200: "#eeeeee",
        300: "#e0e0e0",
        400: "#bdbdbd",
        500: "#9e9e9e",
        600: "#757575",
        700: "#616161",
        800: "#424242",
        900: "#212121",
    },
    background: {
        default: "#ffffff",
        paper: "#f5f5f5",
    },
    text: {
        primary: "#212121",
        secondary: "#757575",
        disabled: "#bdbdbd",
    },
} as const;

// 共有テーマ
export const theme = createTheme({
    palette: {
        primary: colors.primary,
        secondary: colors.secondary,
        success: colors.success,
        error: colors.error,
        warning: colors.warning,
        info: colors.info,
        team1: colors.team1,
        team2: colors.team2,
        team3: colors.team3,
        team4: colors.team4,
        grey: colors.grey,
        background: colors.background,
        text: colors.text,
    },
    typography: {
        htmlFontSize: 16,
        fontFamily: "var(--font-dot-gothic), 'DotGothic16', monospace, sans-serif",
        h1: {
            fontSize: "3rem",
            fontWeight: 400,
            lineHeight: 1.2,
        },
        h2: {
            fontSize: "2.75rem",
            fontWeight: 400,
            lineHeight: 1.3,
        },
        h3: {
            fontSize: "2.5rem",
            fontWeight: 400,
            lineHeight: 1.4,
        },
        h4: {
            fontSize: "2.25rem",
            fontWeight: 400,
            lineHeight: 1.4,
        },
        h5: {
            fontSize: "2rem",
            fontWeight: 400,
            lineHeight: 1.5,
        },
        h6: {
            fontSize: "1.5rem",
            fontWeight: 400,
            lineHeight: 1.6,
        },
        body1: {
            fontSize: "1.5rem",
            lineHeight: 1.6,
        },
        body2: {
            fontSize: "1.3rem",
            lineHeight: 1.6,
        },
        button: {
            textTransform: "none",
            fontWeight: 400,
        },
    },
    spacing: 8,
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: ({ theme, ownerState }) => ({
                    borderRadius: 8,
                    textTransform: "none",
                    fontWeight: 400,
                    boxShadow: "none",
                    "&:hover": {
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    },
                    // カスタムカラーのスタイル
                    ...(ownerState.color === "team1" && {
                        backgroundColor: theme.palette.team1.main,
                        color: theme.palette.team1.contrastText,
                        "&:hover": {
                            backgroundColor: theme.palette.team1.dark,
                            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                        },
                    }),
                    ...(ownerState.color === "team2" && {
                        backgroundColor: theme.palette.team2.main,
                        color: theme.palette.team2.contrastText,
                        "&:hover": {
                            backgroundColor: theme.palette.team2.dark,
                            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                        },
                    }),
                    ...(ownerState.color === "team3" && {
                        backgroundColor: theme.palette.team3.main,
                        color: theme.palette.team3.contrastText,
                        "&:hover": {
                            backgroundColor: theme.palette.team3.dark,
                            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                        },
                    }),
                    ...(ownerState.color === "team4" && {
                        backgroundColor: theme.palette.team4.main,
                        color: theme.palette.team4.contrastText,
                        "&:hover": {
                            backgroundColor: theme.palette.team4.dark,
                            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                        },
                    }),
                    fontSize:
                        ownerState.size === "small"
                            ? "1rem"
                            : ownerState.size === "large"
                            ? "2rem"
                            : "1.5rem",
                }),
                contained: {
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    "&:hover": {
                        boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    "& .MuiOutlinedInput-root": {
                        borderRadius: 8,
                    },
                },
            },
        },
        MuiBottomNavigation: {
            styleOverrides: {
                root: {
                    height: "auto",
                    padding: "8px 0",
                },
            },
        },
        MuiBottomNavigationAction: {
            styleOverrides: {
                root: {
                    fontSize: "1.3rem", // ラベルのフォントサイズ
                    minWidth: "auto",
                    padding: "6px 12px",
                    "& .MuiSvgIcon-root": {
                        fontSize: "3rem", // アイコンのサイズ
                    },
                    "& .MuiBottomNavigationAction-label": {
                        fontSize: "0.75rem", // ラベルのフォントサイズを明示的に指定
                        marginTop: "4px",
                    },
                },
            },
        },
    },
});

export default theme;
