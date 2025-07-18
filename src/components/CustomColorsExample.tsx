import React from "react";
import { Box, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@/theme";
import { CustomButton } from "@/components/base/CustomButton";

export const CustomColorsExample: React.FC = () => {
    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ p: 3 }}>
                <Typography variant="h4" gutterBottom>
                    カスタムカラーボタンの例
                </Typography>

                {/* 既存のMaterial UIカラー */}
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                    標準カラー
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
                    <CustomButton color="primary">Primary</CustomButton>
                    <CustomButton color="secondary">Secondary</CustomButton>
                    <CustomButton color="success">Success</CustomButton>
                    <CustomButton color="error">Error</CustomButton>
                    <CustomButton color="warning">Warning</CustomButton>
                    <CustomButton color="info">Info</CustomButton>
                </Box>

                {/* 新しいカスタムカラー */}
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                    カスタムカラー
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
                    <CustomButton color="team1">Team1</CustomButton>
                    <CustomButton color="team2">Team2</CustomButton>
                    <CustomButton color="team3">Team3</CustomButton>
                    <CustomButton color="team4">Team4</CustomButton>
                </Box>

                {/* バリエーション */}
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                    バリエーション
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
                    <CustomButton color="team1" variant="outlined">
                        Outlined
                    </CustomButton>
                    <CustomButton color="team2" variant="text">
                        Text
                    </CustomButton>
                    <CustomButton color="team3" size="small">
                        Small
                    </CustomButton>
                    <CustomButton color="team4" size="large">
                        Large
                    </CustomButton>
                </Box>

                {/* 状態 */}
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                    状態
                </Typography>
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
                    <CustomButton color="team1" loading>
                        Loading...
                    </CustomButton>
                    <CustomButton color="team2" disabled>
                        Disabled
                    </CustomButton>
                </Box>
                <Box sx={{ width: "100%", maxWidth: 400 }}>
                    <CustomButton color="team3" fullWidth>
                        Full Width
                    </CustomButton>
                </Box>

                {/* カラーパレット表示 */}
                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                    カラーパレット
                </Typography>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                        gap: 2,
                    }}
                >
                    {[
                        { name: "Team1", color: theme.palette.team1 },
                        { name: "Team2", color: theme.palette.team2 },
                        { name: "Team3", color: theme.palette.team3 },
                        { name: "Team4", color: theme.palette.team4 },
                    ].map(({ name, color }) => (
                        <Box key={name} sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: 1 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                {name}
                            </Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            backgroundColor: color.main,
                                            borderRadius: 0.5,
                                            border: "1px solid #ccc",
                                        }}
                                    />
                                    <Typography variant="caption">Main: {color.main}</Typography>
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            backgroundColor: color.light,
                                            borderRadius: 0.5,
                                            border: "1px solid #ccc",
                                        }}
                                    />
                                    <Typography variant="caption">Light: {color.light}</Typography>
                                </Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            backgroundColor: color.dark,
                                            borderRadius: 0.5,
                                            border: "1px solid #ccc",
                                        }}
                                    />
                                    <Typography variant="caption">Dark: {color.dark}</Typography>
                                </Box>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default CustomColorsExample;
