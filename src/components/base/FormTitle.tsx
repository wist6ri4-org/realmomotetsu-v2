import { Box, Typography } from "@mui/material";
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
 * @param {FormTitleProps} props - FormTitleのプロパティ
 * @returns {JSX.Element} - FormTitleコンポーネント
 */
const FormTitle: React.FC<FormTitleProps> = ({
    title,
    icon,
}: FormTitleProps): React.JSX.Element => {
    return (
        <>
            <Box sx={{ display: "flex", alignItems: "left", margin: 1 }}>
                {icon}
                <Typography variant="h6" fontWeight={700}>
                    {title}
                </Typography>
            </Box>
        </>
    );
};

export default FormTitle;
