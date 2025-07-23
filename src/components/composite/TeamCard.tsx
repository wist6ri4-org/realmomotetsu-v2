import Image from "next/image";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { TeamData } from "@/types/TeamData";
import { Converter } from "@/utils/converter";
import Toll from "@mui/icons-material/Toll";
import { Teams } from "@/generated/prisma";

/**
 * TeamCardコンポーネントのプロパティ型定義
 * @property {TeamData} teamData - チームのデータ
 * @property {Teams | null} bombiiTeamData - Bombiiチームのデータ（オプション）
 */
type TeamCardProps = {
    teamData: TeamData;
    bombiiTeamData: Teams | null;
};

/**
 * LastStationTypographyコンポーネントのプロパティ型定義
 * @property {number} length - 駅名の文字数
 */
interface LastStationTypographyProps {
    length: number;
}

/**
 * LastStationTypographyコンポーネント
 * @param length - 駅名の文字数
 * @returns {JSX.Element} - LastStationTypographyコンポーネント
 */
const LastStationTypography = styled(Typography, {
    shouldForwardProp: (prop) => prop !== "length",
})<LastStationTypographyProps>(({ length }) => {
    let size;
    if (length > 8) {
        size = "1.1rem";
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
 * TeamCardコンポーネント
 * @param teamData - チームのデータ
 * @param bombiiTeamData - Bombiiチームのデータ（オプション）
 * @returns {JSX.Element} - TeamCardコンポーネント
 */
export const TeamCard: React.FC<TeamCardProps> = ({
    teamData,
    bombiiTeamData,
}): React.JSX.Element => {
    const lastStation = teamData.transitStations[teamData.transitStations.length - 1] || null;
    return (
        <>
            <Box
                sx={{
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))",
                    gap: 0,
                }}
            >
                {/* チーム名 */}
                <Box sx={{ display: "flex", justifyContent: "start" }}>
                    {bombiiTeamData && bombiiTeamData.teamCode === teamData.teamCode && (
                        <Image
                            alt="Bombii"
                            src={"/moving_bombii.png?" + new Date().getTime()}
                            width={0}
                            height={0}
                            unoptimized
                            style={{ width: "auto", height: "2.5rem", marginRight: "0.5rem" }}
                        />
                    )}
                    <Typography variant="h5">{teamData.teamName}</Typography>
                </Box>

                {/* チームカード */}
                <Card
                    variant="outlined"
                    sx={{ borderRadius: 0.5, backgroundColor: teamData.teamColor }}
                >
                    <CardContent
                        sx={{
                            color: "white",
                            padding: 1,
                            "&:last-child": {
                                paddingBottom: 1, // または 0
                            },
                        }}
                    >
                        {/* 総資産 */}
                        <Grid
                            container
                            spacing={1}
                            justifyContent={"space-between"}
                            sx={{ backgroundColor: "rgba(0, 0, 0, 0.5)", padding: 0.5 }}
                        >
                            <Grid size={4}>
                                <Typography variant="body2">
                                    <strong>総資産</strong>
                                </Typography>
                            </Grid>
                            <Grid size={8}>
                                <Typography variant="body2" textAlign={"right"}>
                                    {Converter.convertPointsToYen(teamData.scoredPoints)}
                                </Typography>
                            </Grid>
                        </Grid>

                        {/* ポイント */}
                        <Box
                            sx={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "end",
                                alignItems: "center",
                            }}
                        >
                            <Toll sx={{ marginInlineEnd: 1 }} />
                            <Typography variant="body2" component={"span"}>
                                {teamData.points} pt
                            </Typography>
                        </Box>

                        {/* 現在地 */}
                        <Box>
                            <Typography variant="body2" sx={{ marginBottom: 0.5 }}>
                                現在地は
                            </Typography>
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    gap: 0,
                                    height: "5rem",
                                }}
                            >
                                {lastStation ? (
                                    <LastStationTypography
                                        variant="h4"
                                        textAlign={"center"}
                                        length={lastStation.station.name.length}
                                    >
                                        {lastStation.station.name}
                                    </LastStationTypography>
                                ) : (
                                    <Typography variant="body2" textAlign={"center"}>
                                        データなし
                                    </Typography>
                                )}
                            </Box>
                        </Box>

                        {/* 残り駅数と最終更新時刻 */}
                        <Grid container spacing={1} justifyContent={"space-between"}>
                            <Grid size={6}>
                                <Typography variant="body2">
                                    残り {teamData.remainingStationsNumber} 駅
                                </Typography>
                            </Grid>
                            <Grid size={6}>
                                <Typography variant="body2" textAlign={"right"}>
                                    {Converter.convertUTCtoJST(lastStation.createdAt)}
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            </Box>
        </>
    );
};
