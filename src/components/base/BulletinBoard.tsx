"use client";

import React, { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import { keyframes } from "@mui/system";

/**
 * BulletinBoardコンポーネントのプロパティ型定義
 * @param {string} nextStation - 次の駅名
 * @param {string} nextStationEng - 次の駅名（英語表記、駅コード）
 */
interface BulletinBoardProps {
    nextStation: string;
    nextStationEng: string;
}

// 無限スクロールアニメーションの定義（電光掲示板風）
const slideDestination = keyframes`
    0% {
        transform: translate3d(0, 0, 0);
    }
    100% {
        transform: translate3d(-50%, 0, 0);
    }
`;

/**
 * BulletinBoardコンポーネント
 * @param {BulletinBoardProps} props - BulletinBoardのプロパティ
 * @returns {JSX.Element} - BulletinBoardコンポーネント
 */
const BulletinBoard: React.FC<BulletinBoardProps> = ({
    nextStation,
    nextStationEng,
}: BulletinBoardProps): React.JSX.Element => {
    const [isVisible, setIsVisible] = useState(true);
    const [animationKey, setAnimationKey] = useState(0);

    useEffect(() => {
        const handleVisibilityChange = () => {
            const visible = !document.hidden;
            if (visible) {
                // ページが表示されたらアニメーションを一時停止してからリセット
                setIsVisible(false);
                // 次のフレームでアニメーションを再開
                requestAnimationFrame(() => {
                    setAnimationKey(prev => prev + 1);
                    setIsVisible(true);
                });
            } else {
                setIsVisible(false);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        // iOS PWA用：pageshow/pagehideイベントも監視
        const handlePageShow = () => {
            // ページ表示時はアニメーションをリセット
            setIsVisible(false);
            requestAnimationFrame(() => {
                setAnimationKey(prev => prev + 1);
                setIsVisible(true);
            });
        };

        const handlePageHide = () => {
            setIsVisible(false);
        };

        window.addEventListener("pageshow", handlePageShow);
        window.addEventListener("pagehide", handlePageHide);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("pageshow", handlePageShow);
            window.removeEventListener("pagehide", handlePageHide);
        };
    }, []);

    const space = "　";

    // 表示するテキストコンテンツ
    const displayText = `次は ${nextStation + space.repeat(7)} Next ${nextStationEng + space.repeat(7)}`;

    return (
        <Box
            sx={{
                width: "100%",
                height: "100%",
                backgroundColor: "#212529",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                borderRadius: 0.5,
                WebkitOverflowScrolling: "touch", // iOS用
                position: "relative",
            }}
        >
            <Box
                key={animationKey} // アニメーション再起動用
                sx={{
                    animation: isVisible
                        ? `${slideDestination} 20s linear infinite`
                        : "none",
                    display: "flex",
                    whiteSpace: "nowrap",
                    willChange: "transform",
                    transform: "translate3d(0, 0, 0)", // iOS用にtranslate3dを使用
                    WebkitTransform: "translate3d(0, 0, 0)", // Webkit用プレフィックス
                    backfaceVisibility: "hidden", // iOS用
                    WebkitBackfaceVisibility: "hidden",
                }}
            >
                {/* テキストを2回繰り返して無限ループを実現 */}
                <Typography
                    component="span"
                    sx={{
                        fontSize: "2.5rem",
                        color: "orange",
                        letterSpacing: "0.12em",
                        fontWeight: "normal",
                        paddingRight: 4,
                    }}
                >
                    {displayText}
                </Typography>
                <Typography
                    component="span"
                    sx={{
                        fontSize: "2.5rem",
                        color: "orange",
                        letterSpacing: "0.12em",
                        fontWeight: "normal",
                        paddingRight: 4,
                    }}
                >
                    {displayText}
                </Typography>
            </Box>
        </Box>
    );
};

export default BulletinBoard;
