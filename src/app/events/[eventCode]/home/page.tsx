"use client";

import BulletinBoard from "@/components/base/BulletinBoard";
import CustomButton from "@/components/base/CustomButton";
import { UpdatedTime } from "@/components/base/UpdatedTime";
import { TeamCard } from "@/components/base/TeamCard";
import { Teams } from "@/generated/prisma";
import { GoalStationsWithRelations } from "@/repositories/goalStations/GoalStationsRepository";
import { TeamData } from "@/types/TeamData";
import { Alert, Box, CircularProgress, Divider, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import TransitStationsHistoryDialog from "@/components/composite/TransitStationsHistoryDialog";
import { InitHomeResponse } from "@/features/init-home/types";
import { useEventContext } from "../../layout";
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ApplicationErrorHandler } from "@/error/errorHandler";

/**
 * ホームページ
 * @returns {React.JSX.Element} ホームページのコンポーネント
 */
const HomePage: React.FC = (): React.JSX.Element => {
    const { eventCode } = useParams();

    const { teams, isInitDataLoading, contextError } = useEventContext();

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
     * @returns {Promise<void>} データ取得の非同期処理
     */
    const fetchData = async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams();
            params.append("eventCode", eventCode as string);

            const response = await fetch("/api/init-home?" + params.toString());
            if (!response.ok) {
                throw ApplicationErrorFactory.createFromResponse(response);
            }

            const data: InitHomeResponse = (await response.json()).data;
            const teamData = data.teamData || [];
            const nextGoalStationData = data.nextGoalStation || {};
            const bombiiTeamData = data.bombiiTeam || {};

            setTeamData(teamData as TeamData[]);
            setNextGoalStationData(nextGoalStationData as GoalStationsWithRelations);
            setBombiiTeamData(bombiiTeamData as Teams);
        } catch (error) {
            const appError = ApplicationErrorFactory.normalize(error);
            ApplicationErrorHandler.logError(appError);

            setError(appError.message);
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
     * @param {TeamData} teamData - 押下されたカードのチームデータ
     * @returns {void}
     */
    const handleTransitStationsHistoryDialogOpen = (teamData: TeamData): void => {
        setSelectedTeamData(teamData);
        setIsTransitStationsHistoryDialogOpen(true);
    };

    /**
     * 経由駅履歴ダイアログを閉じるハンドラー
     * @returns {void}
     */
    const handleTransitStationsHistoryDialogClose = (): void => {
        setIsTransitStationsHistoryDialogOpen(false);
        setSelectedTeamData(null);
    };

    return (
        <>
            {/* サブヘッダーセクション */}
            <Box>
                <BulletinBoard
                    nextStation={nextGoalStationData.station?.name || "ー"}
                    nextStationEng={nextGoalStationData.station?.englishName || "ー"}
                />
            </Box>
            <Divider sx={{ marginY: 2 }} />

            {/* コンテンツセクション */}
            <Box>
                {/* ローディング */}
                {(isLoading || isInitDataLoading) && (
                    <Box sx={{ textAlign: "center", mb: 4 }}>
                        <CircularProgress size={40} color="primary" />
                    </Box>
                )}
                {/* エラー */}
                {(error || contextError) && (
                    <Box sx={{ mb: 4 }}>
                        <Alert severity="error" action={<CustomButton onClick={fetchData}>再試行</CustomButton>}>
                            {error}
                        </Alert>
                    </Box>
                )}
                {/* データの表示 */}
                {!isLoading && !isInitDataLoading && !error && !contextError && (
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
                    team={teams.find((team) => team.id === selectedTeamData.id) as Teams}
                    isOpen={isTransitStationsHistoryDialogOpen}
                    onClose={handleTransitStationsHistoryDialogClose}
                />
            )}

            {/* サブフッターセクション */}
            <Divider sx={{ marginY: 2 }} />
            <Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end", marginY: 1 }}>
                    <CustomButton onClick={fetchData} color="light" variant="contained">
                        更新
                    </CustomButton>
                </Box>
                <UpdatedTime textAlign="right" variant="body2" />
            </Box>
        </>
    );
};

export default HomePage;
