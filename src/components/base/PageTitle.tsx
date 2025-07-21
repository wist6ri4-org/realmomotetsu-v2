import theme from "@/theme";
import { Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import React from "react";

/**
 * PageTitleコンポーネントのプロパティ型定義
 * @property {string} title - ページタイトルのテキスト
 */
interface PageTitleProps {
    title: string;
}

/**
 * PageTitleコンポーネント
 * @param title - ページタイトルのテキスト
 * @return {JSX.Element} - PageTitleコンポーネント
 */
const PageTitle: React.FC<PageTitleProps> = ({title}) => {
    return (
        <ThemeProvider theme={theme}>
            <Typography variant="h4" sx={{ textAlign: "center", margin: 2}}>
                {title}
            </Typography>
        </ThemeProvider>
    )
};

export default PageTitle;
