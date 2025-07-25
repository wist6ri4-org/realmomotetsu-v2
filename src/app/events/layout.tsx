"use client";

import React from "react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { CircularProgress, Box, Typography } from "@mui/material";
import ApplicationBar from "@/components/composite/ApplicationBar";
import Header from "@/components/composite/Header";
import { NavigationBar } from "@/components/composite/NavigationBar";

interface EventsLayoutProps {
    children: React.ReactNode;
}

const EventsLayout: React.FC<EventsLayoutProps> = ({ children }): React.JSX.Element | null => {
const { sbUser, isLoading } = useAuthGuard();

    return (
        <>
            {isLoading && (
                <Box sx={{ textAlign: "center", margin: 4 }}>
                    <CircularProgress size={40} color="primary" />
                    <Typography variant="body1" sx={{ marginTop: 2 }}>
                        認証中...
                    </Typography>
                </Box>
            )}
            {!isLoading && sbUser && (
                <>
                    <ApplicationBar sbUser={sbUser}/>
                    <Header />
                    <Box sx={{ flex: 1, padding: 1 }}>{children}</Box>
                    <NavigationBar />
                </>
            )}
        </>
    );
};

export default EventsLayout;
