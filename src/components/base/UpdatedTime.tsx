import { Typography } from "@mui/material";
import { useEffect, useState } from "react";

export const UpdatedTime: React.FC = () => {
    const [updatedAt, setUpdatedAt] = useState<string>()

    useEffect(() => {
        setUpdatedAt(new Date().toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        }))
    });

    return (
        <Typography variant="body1" sx={{ textAlign: "right", marginTop: 2 }}>
            最終更新日時: {updatedAt}
        </Typography>
    );
}