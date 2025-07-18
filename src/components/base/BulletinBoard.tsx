"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import { keyframes } from "@mui/system";

interface BulletinBoardProps {
    nextStation: string;
    nextStationEng: string;
}

const slideDestination = keyframes`
    0% {
        transform: translateX(100dvw);
    }
    100% {
        transform: translateX(-100%);
    }
`;

const BulletinBoard: React.FC<BulletinBoardProps> = ({ nextStation, nextStationEng }) => {
    return (
        <Box
            sx={{
                width: "100%",
                height: "100%",
                backgroundColor: "#212529",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
            }}
        >
            <Box
                component="ul"
                sx={{
                    animation: `${slideDestination} 20s linear infinite`,
                    display: "inline-block",
                    margin: 0,
                    paddingLeft: "0",
                    whiteSpace: "nowrap",
                    listStyle: "none",
                    padding: 0,
                }}
            >
                <Box
                    component="li"
                    sx={{
                        display: "inline",
                    }}
                >
                    <Typography
                        component="span"
                        sx={{
                            fontSize: "2.5rem",
                            color: "orange",
                            letterSpacing: "0.12em",
                            fontWeight: "normal",
                        }}
                    >
                        次は{" "}
                        <Typography
                            component="span"
                            sx={{
                                fontSize: "inherit",
                                color: "inherit",
                                letterSpacing: "inherit",
                                fontWeight: "inherit",
                            }}
                            marginRight={40}
                        >
                            {nextStation}
                        </Typography>
                        {" "}Next{" "}
                        <Typography
                            component="span"
                            sx={{
                                fontSize: "inherit",
                                color: "inherit",
                                letterSpacing: "inherit",
                                fontWeight: "inherit",
                            }}
                        >
                            {nextStationEng}
                        </Typography>
                    </Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default BulletinBoard;
