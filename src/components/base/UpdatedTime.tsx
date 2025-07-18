import { Typography } from "@mui/material";
import { useEffect, useState } from "react";

type UpdatedTimeProps = {
    textAlign?: "left" | "center" | "right";
    variant?: "body1" | "body2" | "h4" | "h5";
};

export const UpdatedTime: React.FC<UpdatedTimeProps> = ({
    textAlign = "center",
    variant = "body1",
}) => {
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
