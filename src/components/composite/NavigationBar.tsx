"use client";

import theme from "@/theme";
import { ThemeProvider } from "@emotion/react";
import { Assignment, Casino, Home, Settings } from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction, Box } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";

/**
 * NavigationBarコンポーネントのプロパティ型定義
 * @property {string} [currentTab] - 現在のタブ名（
 */
interface NavigationBarProps {
    currentTab?: string;
}

/**
 * NavigationBarコンポーネント
 * @param currentTab - 現在のタブ名（オプション）
 * @return {JSX.Element} - NavigationBarコンポーネント
 */
export const NavigationBar: React.FC<NavigationBarProps> = ({ currentTab }) => {
    const router = useRouter();
    const pathname = usePathname();

    const getCurrentTab = () => {
        if (currentTab) return currentTab;
        if (pathname.includes("/home")) return "home";
        if (pathname.includes("/roulette")) return "roulette";
        if (pathname.includes("/form")) return "form";
        if (pathname.includes("/operation")) return "operation";
        return "home"; // デフォルト
    };

    const activeTab = getCurrentTab();

    const handleNavChange = (event: React.SyntheticEvent, newValue: number) => {
        router.push(`/${newValue}`);
    };

    const navigation = [
        { value: "home", label: "ホーム", icon: <Home />, path: "/home" },
        { value: "roulette", label: "ルーレット", icon: <Casino />, path: "/roulette" },
        { value: "form", label: "フォーム", icon: <Assignment />, path: "/form" },
        { value: "operation", label: "オペレーション", icon: <Settings />, path: "/operation" },
    ];

    return (
        <ThemeProvider theme={theme}>
            <Box
                component="footer"
                sx={{ width: "100%", position: "sticky", bottom: 0, zIndex: 1100 }}
            >
                <BottomNavigation showLabels value={activeTab} onChange={handleNavChange}>
                    {navigation.map((nav) => (
                        <BottomNavigationAction
                            key={nav.value}
                            label={nav.label}
                            icon={nav.icon}
                            value={nav.value}
                        />
                    ))}
                </BottomNavigation>
            </Box>
        </ThemeProvider>
    );
};
