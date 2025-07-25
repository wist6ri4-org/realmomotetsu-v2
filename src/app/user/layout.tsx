"use client";

import React from "react";
import { Box } from "@mui/material";

interface UserLayoutProps {
    children: React.ReactNode;
}

const UserLayout: React.FC<UserLayoutProps> = ({ children }): React.JSX.Element | null => {

    return (
        <>
            <Box sx={{ flex: 1, padding: 1 }}>
                {children}
            </Box>
        </>
    );
};

export default UserLayout;
