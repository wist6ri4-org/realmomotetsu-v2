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
        transform: translate3d(100vw, 0, 0);
    }
    100% {
        transform: translate3d(-100%, 0, 0);
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
        const resetAnimation = () => {
            // アニメーションを完全に停止
            setIsVisible(false);
            // 短い遅延を入れてDOMを確実に更新
            setTimeout(() => {
                // キーを変更してDOMを再作成
                setAnimationKey(prev => prev + 1);
                // さらに短い遅延の後にアニメーション再開
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setIsVisible(true);
                    });
                });
            }, 50);
        };

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                resetAnimation();
            } else {
                setIsVisible(false);
            }
        };

        const handlePageShow = () => {
            // bfcacheから復帰した場合も含めてリセット
            resetAnimation();
        };

        const handlePageHide = () => {
            setIsVisible(false);
        };

        const handleFocus = () => {
            // ダイアログなどから戻った時用
            resetAnimation();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("pageshow", handlePageShow);
        window.addEventListener("pagehide", handlePageHide);
        window.addEventListener("focus", handleFocus);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("pageshow", handlePageShow);
            window.removeEventListener("pagehide", handlePageHide);
            window.removeEventListener("focus", handleFocus);
        };
    }, []);

    const space = "　";

    // 表示するテキストコンテンツ
    const displayText = `次は ${nextStation + space.repeat(7)} Next ${nextStationEng}`;

    return (
        <Box
            sx={{
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
                <Box sx={{ display: "flex" }}>
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
                        {displayText + space.repeat(7)}
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
        </Box>
    );
};

export default BulletinBoard;
