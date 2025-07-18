"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@/theme";
import { CustomButton } from "@/components/base/CustomButton";

export default function FontTestPage() {
    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ p: 4 }}>
                <Typography variant="h2" gutterBottom>
                    DotGothic16 フォントテスト
                </Typography>

                <Typography variant="h4" sx={{ mb: 3 }}>
                    東急線リアル桃鉄
                </Typography>

                <Typography variant="body1" sx={{ mb: 2 }}>
                    このページではDotGothic16フォントが使用されています。
                    ゲームのような雰囲気を演出するピクセルフォントです。
                </Typography>

                <Typography variant="body1" sx={{ mb: 3 }}>
                    日本語文字: あいうえお かきくけこ さしすせそ
                    <br />
                    英数字: ABCDEFG 1234567890
                    <br />
                    記号: !@#$%^&*()_+-=[]|:&quot;;&#39;&lt;&gt;?,.\/
                </Typography>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        ボタンでのフォント表示
                    </Typography>
                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                        <CustomButton color="primary">プライマリボタン</CustomButton>
                        <CustomButton color="team1">カスタムボタン1</CustomButton>
                        <CustomButton color="team2">カスタムボタン2</CustomButton>
                        <CustomButton color="team3">アクセントボタン</CustomButton>
                    </Box>
                </Box>

                <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        様々なサイズでの表示
                    </Typography>
                    <Typography variant="h1" sx={{ mb: 1 }}>
                        見出し1 - DotGothic16
                    </Typography>
                    <Typography variant="h2" sx={{ mb: 1 }}>
                        見出し2 - DotGothic16
                    </Typography>
                    <Typography variant="h3" sx={{ mb: 1 }}>
                        見出し3 - DotGothic16
                    </Typography>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                        見出し4 - DotGothic16
                    </Typography>
                    <Typography variant="h5" sx={{ mb: 1 }}>
                        見出し5 - DotGothic16
                    </Typography>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        見出し6 - DotGothic16
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        本文1 - DotGothic16
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        本文2 - DotGothic16
                    </Typography>
                    <Typography variant="caption">キャプション - DotGothic16</Typography>
                </Box>

                <Box
                    sx={{
                        p: 3,
                        border: "2px solid",
                        borderColor: "primary.main",
                        borderRadius: 2,
                        backgroundColor: "background.paper",
                    }}
                >
                    <Typography variant="h5" gutterBottom>
                        ゲーム風UI要素
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        HP: 100/100 ■■■■■■■■■■
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 2 }}>
                        MP: 50/50 ■■■■■□□□□□
                    </Typography>
                    <Typography variant="body1">経験値: 1234/2000</Typography>
                </Box>
            </Box>
        </ThemeProvider>
    );
}
