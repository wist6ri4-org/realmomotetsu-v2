import { GoalStationsWithRelations } from "@/repositories/goalStations/GoalStationsRepository";
import { TeamData } from "@/types/TeamData";
import {
    Box,
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
    Stack,
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

// ZOOMデフォルト値
const DEFAULT_ZOOM = 1.0;
// ZOOM最大値
const MAX_ZOOM = 2.0;
// ZOOM最小値
const MIN_ZOOM = 0.5;
// ZOOMステップ値
const ZOOM_STEP = 0.25;
// スライダーのステップ値
const SLIDER_ZOOM_STEP = 0.1;
// スライダーのラベル表示
const SLIDER_MARKS = [...Array(((MAX_ZOOM - MIN_ZOOM) / ZOOM_STEP) * 2 + 1)].map((_, index) => {
    const value = MIN_ZOOM + index * ZOOM_STEP * 2;
    return { value, label: `${Math.round(value * 100)}%` };
});
// マウスホイールズームステップ値
const MOUSE_WHEEL_ZOOM_STEP = 0.05;

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

    const [aspectRatio, setAspectRatio] = useState<number>(5600 / 4000);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [visibleTeams, setVisibleTeams] = useState<string[]>([]);
    const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
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
    const handleOpen = (): void => {
        setIsOpen(true);
    };

    /**
     * ダイアログを閉じるハンドラー
     */
    const handleClose = (): void => {
        setIsOpen(false);
    };

    /**
     * チーム表示切り替えハンドラー
     * @param teamCode チームコード
     */
    const handleTeamVisibilityToggle = (teamCode: string): void => {
        setVisibleTeams((prev) =>
            prev.includes(teamCode) ? prev.filter((code) => code !== teamCode) : [...prev, teamCode]
        );
    };

    /**
     * ズームイン
     */
    const handleZoomIn = (): void => {
        setZoomLevel((prev) => Math.min(prev + ZOOM_STEP, MAX_ZOOM));
    };

    /**
     * ズームアウト
     */
    const handleZoomOut = (): void => {
        setZoomLevel((prev) => Math.max(prev - ZOOM_STEP, MIN_ZOOM));
    };

    /**
     * ズームリセット
     */
    const handleZoomReset = () => {
        setZoomLevel(DEFAULT_ZOOM);
    };

    /**
     * マウスホイールでのズーム処理
     */
    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -MOUSE_WHEEL_ZOOM_STEP : MOUSE_WHEEL_ZOOM_STEP;
            setZoomLevel((prev) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta)));
        }
    }, []);

    /**
     * タッチイベントでのピンチ操作
     * @param e - タッチイベントオブジェクト
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

    /**
     * タッチイベントでのピンチ操作によるズーム処理
     * @param e - タッチイベントオブジェクト
     */
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
                const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, initialZoom * scale));
                setZoomLevel(newZoom);
            }
        }
    }, []);

    /**
     * アスペクト比の設定
     * @param a - 幅
     * @param b - 高さ
     * @returns void
     */
    const handleAspectRatio = (a: number, b: number): void => {
        setAspectRatio(a / b);
    };

    return (
        <>
            {/* データの表示 */}
            {!isLoading && !error && (
                <>
                    <Fab color="primary" aria-label="info" onClick={handleOpen} sx={{ zIndex: 400 }}>
                        <MapIcon />
                    </Fab>
                    <Dialog
                        open={isOpen}
                        onClose={handleClose}
                        aria-labelledby="routemap-dialog-title"
                        aria-describedby="routemap-dialog-description"
                        fullScreen
                        sx={{ zIndex: 500 }}
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
                                        aspectRatio: aspectRatio, // viewBoxの比率を維持
                                    }}
                                >
                                    <Routemap
                                        teamData={teamData}
                                        nextGoalStation={nextGoalStation}
                                        bombiiTeam={bombiiTeam}
                                        stationsFromDB={stations}
                                        visibleTeams={visibleTeams}
                                        handleAspectRatio={handleAspectRatio}
                                    />
                                </Box>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ p: 1 }}>
                            <Stack spacing={2} width="100%">
                                {/* ズームコントロール */}
                                <Paper elevation={3} sx={{ p: 1, width: "100%" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                        <IconButton
                                            onClick={handleZoomOut}
                                            disabled={zoomLevel <= MIN_ZOOM}
                                            size="medium"
                                        >
                                            <ZoomOutIcon sx={{ fontSize: 25 }} />
                                        </IconButton>
                                        <Box sx={{ flex: 1, mx: 2 }}>
                                            <Slider
                                                value={zoomLevel}
                                                onChange={(_, newValue) => setZoomLevel(newValue as number)}
                                                min={MIN_ZOOM}
                                                max={MAX_ZOOM}
                                                step={SLIDER_ZOOM_STEP}
                                                marks={SLIDER_MARKS}
                                                valueLabelDisplay="auto"
                                                valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
                                            />
                                        </Box>
                                        <IconButton
                                            onClick={handleZoomIn}
                                            disabled={zoomLevel >= MAX_ZOOM}
                                            size="medium"
                                        >
                                            <ZoomInIcon sx={{ fontSize: 25 }} />
                                        </IconButton>
                                        <IconButton onClick={handleZoomReset} size="medium" title="100%にリセット">
                                            <RestartAltIcon sx={{ fontSize: 25 }} />
                                        </IconButton>
                                    </Box>
                                </Paper>
                                {/* チーム表示設定 */}
                                <Paper elevation={3} sx={{ p: 2, width: "100%" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
                                                                    backgroundColor: visibleTeams.includes(
                                                                        team.teamCode
                                                                    )
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
                                                                    backgroundColor: visibleTeams.includes(
                                                                        team.teamCode
                                                                    )
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
                            </Stack>
                        </DialogActions>
                    </Dialog>
                </>
            )}
        </>
    );
};

export default RoutemapDialog;
