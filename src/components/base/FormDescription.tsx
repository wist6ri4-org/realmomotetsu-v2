import { Typography } from "@mui/material";
import React from "react";

/**
 * FormDescriptionコンポーネントのプロパティ型定義
 * @property {React.ReactNode} children - 説明文の内容
 */
interface FormDescriptionProps {
    children: React.ReactNode;
}

/**
 * FormDescriptionコンポーネント
 * @param children - 説明文の内容
 * @returns {JSX.Element} - FormDescriptionコンポーネント
 */
const FormDescription: React.FC<FormDescriptionProps> = ({ children }): React.JSX.Element => {
    return (
        <>
            <Typography variant="body2" sx={{ textAlign: "left", margin: 1 }}>
                {children}
            </Typography>
        </>
    );
};

export default FormDescription;
