import { Box, Typography } from "@mui/material";
import React from "react";

const Footer: React.FC = (): React.JSX.Element => {
    return (
        <>
            <Box sx={{ marginY: 2 }}>
                <Typography variant="body2" color="textSecondary" align="center">
                    &copy; 2025 KANGAERU HITOBITO.
                </Typography>
            </Box>
        </>
    );
};

export default Footer;
