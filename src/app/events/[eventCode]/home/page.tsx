"use client";

import BulletinBoard from "@/components/base/BulletinBoard";
import CustomButton from "@/components/base/CustomButton";
import { UpdatedTime } from "@/components/base/UpdatedTime";
import { TeamCard } from "@/components/base/TeamCard";
import { Teams } from "@/generated/prisma";
import { GoalStationsWithRelations } from "@/repositories/goalStations/GoalStationsRepository";
import { TeamData } from "@/types/TeamData";
import { Alert, Box, CircularProgress, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TransitStationsHistoryDialog from "@/components/composite/TransitStationsHistoryDialog";
import RoutemapDialog from "@/components/composite/RoutemapDialog";

/**
 * ホームページ
 */
const HomePage: React.FC = (): React.JSX.Element => {
    const { eventCode } = useParams();

    const [teamData, setTeamData] = useState<TeamData[]>([]);
    const [nextGoalStationData, setNextGoalStationData] = useState<GoalStationsWithRelations>(
        {} as GoalStationsWithRelations
    );
    const [bombiiTeamData, setBombiiTeamData] = useState<Teams>({} as Teams);

    const [isTransitStationsHistoryDialogOpen, setIsTransitStationsHistoryDialogOpen] = useState(false);
    const [selectedTeamData, setSelectedTeamData] = useState<TeamData | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * データの取得
     */
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams();
            params.append("eventCode", eventCode as string);

            const response = await fetch("/api/init-home?" + params.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(data);
            const teamData = data?.data?.teamData || data?.teamData || [];
            const nextGoalStationData = data?.data?.nextGoalStation || data?.nextGoalStation || {};
            const bombiiTeamData = data?.data?.bombiiTeam || data;
            if (
                !Array.isArray(teamData) ||
                typeof nextGoalStationData !== "object" ||
                typeof bombiiTeamData !== "object"
            ) {
                throw new Error("Unexpected response structure");
            }
            setTeamData(teamData as TeamData[]);
            setNextGoalStationData(nextGoalStationData as GoalStationsWithRelations);
            setBombiiTeamData(bombiiTeamData as Teams);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError(error instanceof Error ? error.message : "Unknown error");
            setTeamData([]);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * 初期表示
     */
    useEffect(() => {
        fetchData();
    }, []);

    /**
     * 経由駅履歴ダイアログを開くハンドラー
     */
    const handleTransitStationsHistoryDialogOpen = (teamData: TeamData) => {
        setSelectedTeamData(teamData);
        setIsTransitStationsHistoryDialogOpen(true);
    };

    /**
     * 経由駅履歴ダイアログを閉じるハンドラー
     */
    const handleTransitStationsHistoryDialogClose = () => {
        setIsTransitStationsHistoryDialogOpen(false);
        setSelectedTeamData(null);
    };

    return (
        <>
            {/* サブヘッダーセクション */}
            <Box>
                <BulletinBoard
                    nextStation={nextGoalStationData.station?.name || "ー"}
                    nextStationEng={nextGoalStationData.station?.stationCode || "ー"}
                />
                <CustomButton onClick={fetchData}>更新</CustomButton>
            </Box>

            {/* コンテンツセクション */}
            <Box>
                {/* ローディング */}
                {isLoading && (
                    <Box sx={{ textAlign: "center", mb: 4 }}>
                        <CircularProgress size={40} color="primary" />
                    </Box>
                )}
                {/* エラー */}
                {error && (
                    <Box sx={{ mb: 4 }}>
                        <Alert severity="error" action={<CustomButton onClick={fetchData}>再試行</CustomButton>}>
                            {error}
                        </Alert>
                    </Box>
                )}
                {/* データの表示 */}
                {!isLoading && !error && (
                    <>
                        {teamData.length > 0 ? (
                            <>
                                <Grid container spacing={2}>
                                    {teamData.map((team) => (
                                        <Grid key={team.id} size={{ xs: 6, sm: 6, md: 3, lg: 3 }}>
                                            <TeamCard
                                                teamData={team}
                                                bombiiTeamData={bombiiTeamData}
                                                onClick={() => handleTransitStationsHistoryDialogOpen(team)}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                                <RoutemapDialog />
                            </>
                        ) : (
                            <Box sx={{ textAlign: "center", py: 8 }}>
                                <Typography variant="body1" color="text.secondary">
                                    データがありません
                                </Typography>
                            </Box>
                        )}
                    </>
                )}
            </Box>

            {/* ダイアログ */}
            {selectedTeamData && (
                <TransitStationsHistoryDialog
                    teamData={selectedTeamData}
                    isOpen={isTransitStationsHistoryDialogOpen}
                    onClose={handleTransitStationsHistoryDialogClose}
                />
            )}

            {/* サブフッターセクション */}
            <UpdatedTime textAlign="right" variant="body2" />
        </>
    );
};

export default HomePage;
