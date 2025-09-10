"use client";

import { Assignment, Casino, Home, Settings } from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction, Box } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";

/**
 * ナビゲーションバーのプロパティ型定義
 * @property {string} [currentTab] - 現在のタブの識別子
 */
interface NavigationBarProps {
    currentTab?: string;
}

/**
 * ナビゲーションバーコンポーネント
 * @param {NavigationBarProps} props - ナビゲーションバーのプロパティ
 * @return {React.JSX.Element} - ナビゲーションバーコンポーネント
 */
export const NavigationBar: React.FC<NavigationBarProps> = ({
    currentTab,
}: NavigationBarProps): React.JSX.Element => {
    const router = useRouter();
    const pathname = usePathname();

    /**
     * 現在のeventCodeを取得する
     */
    const getEventCode = () => {
        const pathSegments = pathname.split("/");
        return pathSegments[2]; // /events/[eventCode]/... の eventCode部分
    };

    /**
     * 現在のタブを取得する
     */
    const getCurrentTab = () => {
        if (currentTab) return currentTab;
        if (pathname.includes("/home")) return "home";
        if (pathname.includes("/roulette")) return "roulette";
        if (pathname.includes("/form")) return "form";
        if (pathname.includes("/operation")) return "operation";
        return "home"; // デフォルト
    };

    const activeTab = getCurrentTab();
    const eventCode = getEventCode();

    /**
     * ナビゲーションの変更ハンドラー
     */
    const handleNavChange = (event: React.SyntheticEvent, newValue: string) => {
        const targetPath = `/events/${eventCode}/${newValue}`;
        router.push(targetPath);
    };

    // ナビゲーションの定義
    const navigation = [
        { value: "home", label: "ホーム", icon: <Home /> },
        { value: "roulette", label: "ルーレット", icon: <Casino /> },
        { value: "form", label: "フォーム", icon: <Assignment /> },
        { value: "operation", label: "その他", icon: <Settings /> },
    ];

    return (
        <Box component="footer" sx={{ width: "100%", position: "sticky", bottom: 0, zIndex: 3000 }}>
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
    );
};
