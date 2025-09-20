import { Converter } from "@/utils/converter";
import { Box, Typography } from "@mui/material";
import React from "react";

export interface PointExchangerDisplayProps {
    points: number;
}

const PointExchangerDisplay: React.FC<PointExchangerDisplayProps> = ({ points }): React.JSX.Element => {
    const exchangedPoints = Converter.convertPointsToYen(points);

    return (
        <>
            <Box border={1} borderColor="grey.400" borderRadius={1} width={150} padding={1} marginY={1} textAlign={"end"}>
                <Typography variant="body2">{exchangedPoints}</Typography>
            </Box>
        </>
    );
};

export default PointExchangerDisplay;
