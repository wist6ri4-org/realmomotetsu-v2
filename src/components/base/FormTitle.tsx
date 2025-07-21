import theme from "@/theme";
import { Box, ThemeProvider, Typography } from "@mui/material";
import React from "react";

/**
 * FormTitleコンポーネントのプロパティ型定義
 * @property {string} [title] - タイトルのテキスト
 * @property {React.ReactNode} [icon] - タイトルの前に表示するアイコン
 */
interface FormTitleProps {
    title?: string;
    icon?: React.ReactNode;
}

/**
 * FormTitleコンポーネント
 * @param title - タイトルのテキスト
 * @param icon - タイトルの前に表示するアイコン
 * @returns {JSX.Element} - FormTitleコンポーネント
 */
const FormTitle: React.FC<FormTitleProps> = ({ title, icon }) => {
    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ display: "flex", alignItems: "left", margin: 2 }}>
                {icon}
                <Typography variant="h5">
                    {title}
                </Typography>
            </Box>
        </ThemeProvider>
    );
};

export default FormTitle;
