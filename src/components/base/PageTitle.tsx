import { Box, Typography } from "@mui/material";
import React from "react";

/**
 * PageTitleコンポーネントのプロパティ型定義
 * @property {string} title - ページタイトルのテキスト
 */
interface PageTitleProps {
    title: string;
    icon?: React.ReactNode;
}

/**
 * PageTitleコンポーネント
 * @param {PageTitleProps} props - PageTitleのプロパティ
 * @return {JSX.Element} - PageTitleコンポーネント
 */
const PageTitle: React.FC<PageTitleProps> = ({
    title,
    icon,
}: PageTitleProps): React.JSX.Element => {
    return (
        <>
            <Box sx={{ display: "flex", alignItems: "left", margin: 2 }}>
                {icon}
                <Typography variant="h5">{title}</Typography>
            </Box>
        </>
    );
};

export default PageTitle;
