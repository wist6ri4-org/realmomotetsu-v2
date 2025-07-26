import { Stations } from "@/generated/prisma";
import { Box, styled, Typography } from "@mui/material";
import React from "react";

/**
 * RouletteCardコンポーネントのプロパティ型定義
 * @property {Stations | null} displayedStation - 表示する駅情報
 */
interface RouletteCardProps {
    displayedStation: Stations | null;
}

/**
 * LastStationTypographyコンポーネントのプロパティ型定義
 * @property {number} length - 駅名の文字数
 */
interface DisplayedStationTypographyProps {
    length: number;
}

/**
 * LastStationTypographyコンポーネント
 * @param {DisplayedStationTypographyProps} props - LastStationTypographyのプロパティ
 * @returns {JSX.Element} - LastStationTypographyコンポーネント
 */
const DisplayedStationTypography = styled(Typography, {
    shouldForwardProp: (prop) => prop !== "length",
})<DisplayedStationTypographyProps>(({ length }: DisplayedStationTypographyProps) => {
    let size;
    if (length > 8) {
        size = "1.3rem";
    } else if (length > 5) {
        size = "1.8rem";
    } else {
        size = "2.7rem";
    }
    return {
        fontSize: size,
        fontWeight: "300",
        color: "white",
        WebkitTextStroke: "0.5rem black",
        WebKitTextFillColor: "white",
        paintOrder: "stroke",
    };
});

/**
 * RouletteCardコンポーネント
 * @param {RouletteCardProps} props - RouletteCardのプロパティ
 * @return {JSX.Element} - RouletteCardコンポーネント
 */
const RouletteCard: React.FC<RouletteCardProps> = ({
    displayedStation,
}: RouletteCardProps): React.JSX.Element => {
    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginTop: 1,
                    maxWidth: "400px",
                }}
            >
                <Box
                    sx={{
                        backgroundColor: "rgb(114,75,3)",
                        width: "80%",
                        aspectRatio: "16/10",
                        padding: 1,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        borderRadius: 1,
                    }}
                >
                    <Box
                        sx={{
                            backgroundColor: "white",
                            width: "100%",
                            height: "100%",
                            padding: 0.5,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            borderRadius: 1,
                        }}
                    >
                        <Box
                            sx={{
                                backgroundColor: "rgb(36,110,204)",
                                width: "100%",
                                height: "100%",
                                display: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                borderRadius: 1,
                            }}
                        >
                            <Box sx={{ margin: 1 }}>
                                <Typography
                                    variant="body1"
                                    sx={{ color: "white", fontWeight: "bold" }}
                                >
                                    次の目的地は
                                </Typography>
                            </Box>
                            <Box
                                sx={{
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    height: "45%",
                                    verticalAlign: "middle",
                                }}
                            >
                                <DisplayedStationTypography
                                    length={displayedStation ? displayedStation.name.length : 0}
                                >
                                    {displayedStation ? displayedStation.name : "ー"}
                                </DisplayedStationTypography>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default RouletteCard;
