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
    Paper,
    IconButton,
    Slider,
    Typography,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import React, { useEffect, useState, useCallback, useRef } from "react";
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
    const [zoomLevel, setZoomLevel] = useState(1.0); // ズームレベル（0.5〜2.0）
    const dialogContentRef = useRef<HTMLDivElement>(null);

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

    /**
     * ズームイン
     */
    const handleZoomIn = () => {
        setZoomLevel((prev) => Math.min(prev + 0.25, 2.0));
    };

    /**
     * ズームアウト
     */
    const handleZoomOut = () => {
        setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
    };

    /**
     * ズームリセット
     */
    const handleZoomReset = () => {
        setZoomLevel(1.0);
    };

    /**
     * マウスホイールでのズーム処理
     */
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            setZoomLevel((prev) => Math.max(0.5, Math.min(2.0, prev + delta)));
        }
    }, []);

    /**
     * タッチイベントでのピンチ操作
     */
    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            if (e.touches.length === 2) {
                const touch1 = e.touches[0];
                const touch2 = e.touches[1];
                const distance = Math.sqrt(
                    Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2)
                );
                (e.currentTarget as HTMLElement).dataset.initialPinchDistance = distance.toString();
                (e.currentTarget as HTMLElement).dataset.initialZoom = zoomLevel.toString();
            }
        },
        [zoomLevel]
    );

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const distance = Math.sqrt(
                Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2)
            );
            const initialDistance = parseFloat((e.currentTarget as HTMLElement).dataset.initialPinchDistance || "0");
            const initialZoom = parseFloat((e.currentTarget as HTMLElement).dataset.initialZoom || "1");

            if (initialDistance > 0) {
                const scale = distance / initialDistance;
                const newZoom = Math.max(0.5, Math.min(2.0, initialZoom * scale));
                setZoomLevel(newZoom);
            }
        }
    }, []);

    return (
        <>
            {/* データの表示 */}
            {!isLoading && !error && (
                <>
                    <Fab
                        color="primary"
                        aria-label="info"
                        onClick={handleOpen}
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
                        <DialogContent
                            ref={dialogContentRef}
                            sx={{
                                padding: 0,
                                overflow: "hidden",
                                touchAction: "none", // タッチスクロールを無効化
                                position: "relative",
                                border: "1px solid #000",
                            }}
                            onWheel={handleWheel}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                        >
                            <Box
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    overflow: zoomLevel > 1 ? "auto" : "hidden",
                                    display: "flex",
                                    justifyContent: zoomLevel > 1 ? "flex-start" : "center",
                                    alignItems: zoomLevel > 1 ? "flex-start" : "center",
                                }}
                            >
                                <Box
                                    sx={{
                                        transform: `scale(${zoomLevel})`,
                                        transformOrigin: "top left",
                                        width: zoomLevel <= 1 ? "100%" : `${100 / zoomLevel}%`,
                                        height: zoomLevel <= 1 ? "100%" : `${100 / zoomLevel}%`,
                                        minWidth: zoomLevel > 1 ? `${100 * zoomLevel}%` : "auto",
                                        minHeight: zoomLevel > 1 ? `${100 * zoomLevel}%` : "auto",
                                        aspectRatio: "5600 / 4000", // viewBoxの比率を維持
                                    }}
                                >
                                    <Routemap
                                        teamData={teamData}
                                        nextGoalStation={nextGoalStation}
                                        bombiiTeam={bombiiTeam}
                                        stationsFromDB={stations}
                                        visibleTeams={visibleTeams}
                                    />
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ flexDirection: "column", p: 2 }}>
                            {/* ズームコントロール */}
                            <Paper elevation={1} sx={{ p: 2, width: "100%", mb: 2 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                                    <IconButton onClick={handleZoomOut} disabled={zoomLevel <= 0.5} size="medium">
                                        <ZoomOutIcon sx={{ fontSize: 25 }} />
                                    </IconButton>
                                    <Box sx={{ flex: 1, mx: 2 }}>
                                        <Slider
                                            value={zoomLevel}
                                            onChange={(_, newValue) => setZoomLevel(newValue as number)}
                                            min={0.5}
                                            max={2.0}
                                            step={0.1}
                                            marks={[
                                                { value: 0.5, label: "50%" },
                                                { value: 1.0, label: "100%" },
                                                { value: 1.5, label: "150%" },
                                                { value: 2.0, label: "200%" },
                                            ]}
                                            valueLabelDisplay="auto"
                                            valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                                        />
                                    </Box>
                                    <IconButton onClick={handleZoomIn} disabled={zoomLevel >= 2.0} size="medium">
                                        <ZoomInIcon sx={{ fontSize: 25 }} />
                                    </IconButton>
                                    <IconButton onClick={handleZoomReset} size="medium" title="100%にリセット">
                                        <RestartAltIcon sx={{ fontSize: 25 }} />
                                    </IconButton>
                                </Box>
                            </Paper>
                            {/* チーム表示設定 */}
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
