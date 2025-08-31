import { GoalStationsWithRelations } from "@/repositories/goalStations/GoalStationsRepository";
import { TeamData } from "@/types/TeamData";
import {
    Alert,
    Box,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Fab,
    FormControlLabel,
    Switch,
    Typography,
    Paper,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import React, { useEffect, useState, useCallback } from "react";
import CustomButton from "../base/CustomButton";
import Routemap from "./Routemap";
import { useParams } from "next/navigation";
import { InitRoutemapResponse } from "@/features/init-routemap/types";
import { Stations, Teams } from "@/generated/prisma";

/**
 * 路線図ダイアログコンポーネント
 * @returns {React.JSX.Element} 路線図ダイアログコンポーネント
 */
const RoutemapDialog: React.FC = (): React.JSX.Element => {
    const { eventCode } = useParams();

    const [teamData, setTeamData] = useState<TeamData[]>([]);
    const [nextGoalStation, setNextGoalStation] = useState<GoalStationsWithRelations | null>(null);
    const [bombiiTeam, setBombiiTeam] = useState<Teams | null>(null);
    const [stations, setStations] = useState<Stations[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [visibleTeams, setVisibleTeams] = useState<string[]>([]);

    /**
     * データの取得
     */
    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams();
            params.append("eventCode", eventCode as string);

            const response = await fetch("/api/init-routemap?" + params.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: InitRoutemapResponse = (await response.json()).data;
            const teamData = data?.teamData || [];
            const nextGoalStationData = data?.nextGoalStation || {};
            const bombiiTeamData = data?.bombiiTeam || {};
            const stations = data?.stations || [];
            console.log(teamData);
            if (
                !Array.isArray(teamData) ||
                typeof nextGoalStationData !== "object" ||
                typeof bombiiTeamData !== "object" ||
                !Array.isArray(stations)
            ) {
                throw new Error("Unexpected response structure");
            }
            setTeamData(teamData as TeamData[]);
            setNextGoalStation(nextGoalStationData as GoalStationsWithRelations);
            setBombiiTeam(bombiiTeamData as Teams);
            setStations(stations as Stations[]);

            // 初期表示では全チームを表示
            setVisibleTeams((teamData as TeamData[]).map((team) => team.teamCode));
        } catch (error) {
            console.error("Error fetching data:", error);
            setError(error instanceof Error ? error.message : "Unknown error");
            setTeamData([]);
        } finally {
            setIsLoading(false);
        }
    }, [eventCode]);

    /**
     * 初期表示
     */
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    /**
     * ダイアログを開くハンドラー
     */
    const handleOpen = () => {
        setIsOpen(true);
    };

    /**
     * ダイアログを閉じるハンドラー
     */
    const handleClose = () => {
        setIsOpen(false);
    };

    /**
     * チーム表示切り替えハンドラー
     * @param teamCode チームコード
     */
    const handleTeamVisibilityToggle = (teamCode: string) => {
        setVisibleTeams((prev) =>
            prev.includes(teamCode) ? prev.filter((code) => code !== teamCode) : [...prev, teamCode]
        );
    };

    return (
        <>
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
                    <Fab
                        color="success"
                        aria-label="info"
                        onClick={handleOpen}
                        sx={{ top: 100, left: 350, zIndex: 2000 }}
                    >
                        <MapIcon />
                    </Fab>
                    <Dialog
                        open={isOpen}
                        onClose={handleClose}
                        aria-labelledby="routemap-dialog-title"
                        aria-describedby="routemap-dialog-description"
                        fullScreen
                        sx={{ zIndex: 3000 }}
                    >
                        <DialogTitle id="routemap-dialog-title">路線図</DialogTitle>
                        <DialogContent>
                            <Routemap
                                teamData={teamData}
                                nextGoalStation={nextGoalStation}
                                bombiiTeam={bombiiTeam}
                                stationsFromDB={stations}
                                visibleTeams={visibleTeams}
                            />
                        </DialogContent>
                        <DialogActions sx={{ flexDirection: "column", p: 2 }}>
                            <Paper elevation={1} sx={{ p: 2, width: "100%", mb: 2 }}>
                                <Box sx={{ display: "flex", gap: 3 }}>
                                    <Box sx={{ flex: 1 }}>
                                        {teamData.slice(0, Math.ceil(teamData.length / 2)).map((team) => (
                                            <FormControlLabel
                                                key={team.teamCode}
                                                control={
                                                    <Switch
                                                        checked={visibleTeams.includes(team.teamCode)}
                                                        onChange={() => handleTeamVisibilityToggle(team.teamCode)}
                                                        size="small"
                                                        sx={{
                                                            "& .MuiSwitch-thumb": {
                                                                backgroundColor: visibleTeams.includes(team.teamCode)
                                                                    ? team.teamColor
                                                                    : undefined,
                                                            },
                                                        }}
                                                    />
                                                }
                                                label={team.teamName}
                                                sx={{ display: "block", mb: 1 }}
                                            />
                                        ))}
                                    </Box>
                                    <Box sx={{ flex: 1 }}>
                                        {teamData.slice(Math.ceil(teamData.length / 2)).map((team) => (
                                            <FormControlLabel
                                                key={team.teamCode}
                                                control={
                                                    <Switch
                                                        checked={visibleTeams.includes(team.teamCode)}
                                                        onChange={() => handleTeamVisibilityToggle(team.teamCode)}
                                                        size="small"
                                                        sx={{
                                                            "& .MuiSwitch-thumb": {
                                                                backgroundColor: visibleTeams.includes(team.teamCode)
                                                                    ? team.teamColor
                                                                    : undefined,
                                                            },
                                                        }}
                                                    />
                                                }
                                                label={team.teamName}
                                                sx={{ display: "block", mb: 1 }}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            </Paper>
                            <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
                                <CustomButton onClick={handleClose} color="warning">
                                    閉じる
                                </CustomButton>
                            </Box>
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </>
    );
};

export default RoutemapDialog;
