import theme from "@/theme";
import { Box, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
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
 * @param title - ページタイトルのテキスト
 * @return {JSX.Element} - PageTitleコンポーネント
 */
const PageTitle: React.FC<PageTitleProps> = ({ title, icon }): React.JSX.Element => {
    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ display: "flex", alignItems: "left", margin: 2 }}>
                {icon}
                <Typography variant="h5">{title}</Typography>
            </Box>
        </ThemeProvider>
    );
};

export default PageTitle;
