import { Paper, Typography } from "@mui/material";
import React from "react";

/**
 * PageDescriptionコンポーネントのプロパティ型定義
 * @property {React.ReactNode} children - 説明文の内容
 */
interface PageDescriptionProps {
    children: React.ReactNode;
}

/**
 * PageDescriptionコンポーネント
 * @param children - 説明文の内容
 * @returns {JSX.Element} - PageDescriptionコンポーネント
 */
const PageDescription: React.FC<PageDescriptionProps> = ({ children }): React.JSX.Element => {
    return (
        <>
            <Paper variant="outlined">
                <Typography variant="body2" sx={{ textAlign: "left", margin: 2 }}>
                    {children}
                </Typography>
            </Paper>
        </>
    );
};

export default PageDescription;
