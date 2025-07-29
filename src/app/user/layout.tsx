"use client";

import React from "react";
import { Box } from "@mui/material";

/**
 * ユーザー関連ページのレイアウトコンポーネントのプロパティ型定義
 * @param {React.ReactNode} children - レイアウト内に表示する子要素
 */
interface UserLayoutProps {
    children: React.ReactNode;
}

/**
 * ユーザー関連ページのレイアウトコンポーネント
 * @param {UserLayoutProps} props - レイアウトのプロパティ
 * @return {React.JSX.Element | null} - レイアウトコンポーネント
 */
const UserLayout: React.FC<UserLayoutProps> = ({ children }: UserLayoutProps): React.JSX.Element | null => {

    return (
        <>
            <Box sx={{ flex: 1, padding: 1 }}>
                {children}
            </Box>
        </>
    );
};

export default UserLayout;
