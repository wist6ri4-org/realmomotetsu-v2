"use client";

import React from "react";
import { Box } from "@mui/material";
import Image from "next/image";

/**
 * SignupHeaderコンポーネント
 * @returns {JSX.Element} - サインアップヘッダーコンポーネント
 */
export const SignupHeader: React.FC = (): React.JSX.Element => {
    return (
        <>
            <Box
                component="header"
                sx={{
                    width: "100%",
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
                        height: "auto", // 高さを指定
                        overflow: "hidden",
                    }}
                >
                    <Image
                        src="/realmomotetsu_signup_header.png"
                        alt="東急線リアル桃鉄"
                        width={0}
                        height={0}
                        sizes="100dvw"
                        style={{
                            width: "100%",
                            height: "auto",
                        }}
                        priority
                    />
                </Box>
            </Box>
        </>
    );
};

export default SignupHeader;
