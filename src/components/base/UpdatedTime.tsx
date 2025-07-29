import { Typography } from "@mui/material";
import { useEffect, useState } from "react";

/**
 * UpdatedTimeコンポーネントのプロパティ型定義
 * @param {string} [textAlign] - テキストの配置（"left" | "center" | "right"）
 * @param {string} [variant] - テキストのバリアント（"body1" | "body2" | "h4" | "h5"）
 */
type UpdatedTimeProps = {
    textAlign?: "left" | "center" | "right";
    variant?: "body1" | "body2" | "h4" | "h5";
};

/**
 * UpdatedTimeコンポーネント
 * @param {UpdatedTimeProps} props - UpdatedTimeのプロパティ
 * @return {JSX.Element} - UpdatedTimeコンポーネント
 */
export const UpdatedTime: React.FC<UpdatedTimeProps> = ({
    textAlign = "center",
    variant = "body1",
}: UpdatedTimeProps): React.JSX.Element => {
    const [updatedAt, setUpdatedAt] = useState<string>();

    useEffect(() => {
        setUpdatedAt(
            new Date().toLocaleString("ja-JP", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            })
        );
    });

    return (
        <Typography variant={variant} sx={{ textAlign: textAlign, marginTop: 2 }}>
            最終更新日時: {updatedAt}
        </Typography>
    );
};
