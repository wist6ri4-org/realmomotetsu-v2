"use client";

import React from "react";
import { Box, Paper, Tab, Tabs } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "@/theme";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Home, Casino, Assignment, Settings } from "@mui/icons-material";

interface HeaderProps {
    currentTab?: string;
}

export const Header: React.FC<HeaderProps> = ({ currentTab }) => {
    const router = useRouter();
    const pathname = usePathname();

    // 現在のパスからアクティブなタブを判定
    const getCurrentTab = () => {
        if (currentTab) return currentTab;

        if (pathname.includes("/home")) return "home";
        if (pathname.includes("/roulette")) return "roulette";
        if (pathname.includes("/form")) return "form";
        if (pathname.includes("/operation")) return "operation";
        return "home"; // デフォルト
    };

    const activeTab = getCurrentTab();

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        router.push(`/${newValue}`);
    };

    const tabs = [
        { value: "home", label: "ホーム", icon: <Home />, path: "/home" },
        { value: "roulette", label: "ルーレット", icon: <Casino />, path: "/roulette" },
        { value: "form", label: "フォーム", icon: <Assignment />, path: "/form" },
        { value: "operation", label: "オペレーション", icon: <Settings />, path: "/operation" },
    ];

    return (
        <ThemeProvider theme={theme}>
            <Box
                component="header"
                sx={{
                    width: "100%",
                    position: "sticky",
                    top: 0,
                    zIndex: 1100,
                    backgroundColor: "background.paper",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
            >
                {/* ヘッダー画像 */}
                <Box
                    sx={{
                        position: "relative",
                        width: "100%",
                        height: { xs: 200, sm: 250, md: 300 },
                        overflow: "hidden",
                    }}
                >
                    <Image
                        src="/realmomotetsu_header.png"
                        alt="東急線リアル桃鉄"
                        fill
                        style={{
                            objectFit: "cover",
                            objectPosition: "center",
                        }}
                        priority
                    />
                    {/* オーバーレイで可読性向上
                    <Box
                        sx={{
                            position: "absolute",
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: "50%",
                            background: "linear-gradient(transparent, rgba(0,0,0,0.3))",
                        }}
                    /> */}
                </Box>

                {/* ナビゲーションタブ */}
                <Paper
                    elevation={0}
                    sx={{
                        backgroundColor: "primary.main",
                        borderRadius: 0,
                    }}
                >
                    <Tabs
                        value={activeTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                        sx={{
                            minHeight: { xs: 48, sm: 56 },
                            "& .MuiTab-root": {
                                minHeight: { xs: 48, sm: 56 },
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                fontFamily: "var(--font-dot-gothic), monospace",
                                fontWeight: 400,
                                color: "rgba(255,255,255,0.8)",
                                transition: "all 0.3s ease",
                                "&:hover": {
                                    backgroundColor: "rgba(255,255,255,0.1)",
                                    color: "white",
                                },
                                "&.Mui-selected": {
                                    color: "white",
                                    backgroundColor: "rgba(255,255,255,0.2)",
                                    fontWeight: "bold",
                                },
                            },
                            "& .MuiTabs-indicator": {
                                backgroundColor: "white",
                                height: 3,
                            },
                        }}
                    >
                        {tabs.map((tab) => (
                            <Tab
                                key={tab.value}
                                value={tab.value}
                                label={
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: { xs: "column", sm: "row" },
                                            alignItems: "center",
                                            gap: { xs: 0.5, sm: 1 },
                                        }}
                                    >
                                        {tab.icon}
                                        <span>{tab.label}</span>
                                    </Box>
                                }
                                sx={{
                                    textTransform: "none",
                                }}
                            />
                        ))}
                    </Tabs>
                </Paper>
            </Box>
        </ThemeProvider>
    );
};

export default Header;
