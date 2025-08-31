import { GoalStationsWithRelations } from "@/repositories/goalStations/GoalStationsRepository";
import { TeamData } from "@/types/TeamData";
import { Alert, Box, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Fab } from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import React, { useEffect, useState } from "react";
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

    /**
     * データの取得
     */
    const fetchData = async () => {
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
                            />
                        </DialogContent>
                        <DialogActions>
                            <CustomButton onClick={handleClose} color="warning">
                                閉じる
                            </CustomButton>
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </>
    );
};

export default RoutemapDialog;
