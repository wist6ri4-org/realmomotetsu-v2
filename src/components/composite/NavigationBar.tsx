"use client";

import { CommonConstants } from "@/constants/commonConstants";
import { Assignment, Casino, Home, Settings } from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction, Box } from "@mui/material";
import { usePathname, useRouter } from "next/navigation";
import { useIOSKeyboardFix } from "@/hooks/useIOSKeyboardFix";

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
export const NavigationBar: React.FC<NavigationBarProps> = ({ currentTab }: NavigationBarProps): React.JSX.Element => {
    const router = useRouter();
    const pathname = usePathname();

    // iOS キーボード対応（画面下部固定のため isBottomFixed = true）
    useIOSKeyboardFix("[data-navigation-bar]", CommonConstants.CSS.VARIABLES.NAVIGATION_BAR_HEIGHT, true);



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
        <Box
            data-navigation-bar
            sx={{
                width: "100%",
                position: "fixed",
                bottom: 0,
                zIndex: 400,
                backgroundColor: "background.paper",
                borderTop: 1,
                borderColor: "divider",
                // iOS PWA対応 - キーボード展開時の対応を改善
                WebkitTransform: "translate3d(0, 0, 0)",
                transform: "translate3d(0, 0, 0)",
                // iOS セーフエリア対応
                paddingBottom: "env(safe-area-inset-bottom)",
                // Android セーフエリア対応
                paddingTop: "env(safe-area-inset-top)",
                paddingLeft: "env(safe-area-inset-left)",
                paddingRight: "env(safe-area-inset-right)",
                // ブラウザの互換性対応
                WebkitBackfaceVisibility: "hidden",
                backfaceVisibility: "hidden",
                // パフォーマンス改善
                contain: "layout style paint",
                willChange: "transform",
                // iOS キーボード対応のための追加スタイル
                "@supports (-webkit-touch-callout: none)": {
                    // iOS専用の調整
                    position: "fixed !important",
                },
            }}
            maxWidth={900}
        >
            <BottomNavigation showLabels value={activeTab} onChange={handleNavChange}>
                {navigation.map((nav) => (
                    <BottomNavigationAction key={nav.value} label={nav.label} icon={nav.icon} value={nav.value} />
                ))}
            </BottomNavigation>
        </Box>
    );
};
