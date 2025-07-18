import React from "react";
import { Box, Typography, Card, CardContent } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { theme, colors } from "@/theme";
import { getColor } from "@/theme/colors";
import { CustomButton } from "@/components/base/CustomButton";

export const ColorPaletteExample: React.FC = () => {
    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ padding: 3 }}>
                <Typography variant="h4" gutterBottom>
                    共有カラーパレットの例
                </Typography>

                {/* ボタンの例 */}
                <Card sx={{ marginBottom: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            カスタムボタン
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                            <CustomButton color="primary">Primary</CustomButton>
                            <CustomButton color="secondary">Secondary</CustomButton>
                            <CustomButton color="success">Success</CustomButton>
                            <CustomButton color="error">Error</CustomButton>
                            <CustomButton color="warning">Warning</CustomButton>
                            <CustomButton color="info">Info</CustomButton>
                        </Box>
                    </CardContent>
                </Card>

                {/* カラーパレット表示 */}
                <Card sx={{ marginBottom: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            カラーパレット
                        </Typography>
                        <Box
                            sx={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                gap: 2,
                            }}
                        >
                            {Object.entries(colors)
                                .slice(0, 6)
                                .map(([colorName, colorValue]) => (
                                    <Box key={colorName}>
                                        <Typography
                                            variant="subtitle2"
                                            sx={{ marginBottom: 1, textTransform: "capitalize" }}
                                        >
                                            {colorName}
                                        </Typography>
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                gap: 1,
                                            }}
                                        >
                                            {typeof colorValue === "object" &&
                                                colorValue !== null && (
                                                    <>
                                                        {Object.entries(colorValue).map(
                                                            ([variant, color]) => (
                                                                <Box
                                                                    key={variant}
                                                                    sx={{
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: 1,
                                                                    }}
                                                                >
                                                                    <Box
                                                                        sx={{
                                                                            width: 24,
                                                                            height: 24,
                                                                            backgroundColor: color,
                                                                            borderRadius: 1,
                                                                            border: "1px solid #e0e0e0",
                                                                        }}
                                                                    />
                                                                    <Typography variant="caption">
                                                                        {variant}: {color}
                                                                    </Typography>
                                                                </Box>
                                                            )
                                                        )}
                                                    </>
                                                )}
                                        </Box>
                                    </Box>
                                ))}
                        </Box>
                    </CardContent>
                </Card>

                {/* 直接色を使用する例 */}
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            色の直接使用例
                        </Typography>
                        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                            <Box
                                sx={{
                                    padding: 2,
                                    backgroundColor: getColor("primary"),
                                    color: getColor("primary", "contrastText"),
                                    borderRadius: 1,
                                }}
                            >
                                Primary Background
                            </Box>
                            <Box
                                sx={{
                                    padding: 2,
                                    backgroundColor: getColor("secondary", "light"),
                                    color: getColor("secondary", "contrastText"),
                                    borderRadius: 1,
                                }}
                            >
                                Secondary Light
                            </Box>
                            <Box
                                sx={{
                                    padding: 2,
                                    backgroundColor: getColor("success", "dark"),
                                    color: getColor("success", "contrastText"),
                                    borderRadius: 1,
                                }}
                            >
                                Success Dark
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Box>
        </ThemeProvider>
    );
};

export default ColorPaletteExample;
