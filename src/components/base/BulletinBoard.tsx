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

// スライドアニメーションの定義
const slideDestination = keyframes`
    0% {
        transform: translateX(100%);
    }
    100% {
        transform: translateX(-100%);
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

    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden);
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return (
        <Box
            sx={{
                width: "100%",
                height: "100%",
                backgroundColor: "#212529",
                overflow: "hidden",
                display: "flex",
                borderRadius: 0.5,
            }}
        >
            <Box
                component="ul"
                sx={{
                    animation: isVisible
                        ? `${slideDestination} 20s linear infinite`
                        : "none",
                    display: "inline-block",
                    margin: 0,
                    paddingLeft: "0",
                    whiteSpace: "nowrap",
                    listStyle: "none",
                    padding: 0,
                    willChange: "transform",
                    // transform: "translate3d(0, 0, 0)",
                    transform: "translateX(-50%)"
                }}
            >
                <Box
                    component="li"
                    sx={{
                        display: "inline",
                    }}
                >
                    <Typography
                        component="span"
                        sx={{
                            fontSize: "2.5rem",
                            color: "orange",
                            letterSpacing: "0.12em",
                            fontWeight: "normal",
                        }}
                    >
                        次は{" "}
                        <Typography
                            component="span"
                            sx={{
                                fontSize: "inherit",
                                color: "inherit",
                                letterSpacing: "inherit",
                                fontWeight: "inherit",
                            }}
                            marginRight={40}
                        >
                            {nextStation}
                        </Typography>{" "}
                        Next{" "}
                        <Typography
                            component="span"
                            sx={{
                                fontSize: "inherit",
                                color: "inherit",
                                letterSpacing: "inherit",
                                fontWeight: "inherit",
                            }}
                        >
                            {nextStationEng}
                        </Typography>
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default BulletinBoard;
