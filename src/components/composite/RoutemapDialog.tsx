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
    Grid,
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
import { Teams } from "@/generated/prisma";
import { useEventContext } from "@/app/events/layout";

// ZOOMデフォルト値
const DEFAULT_ZOOM = 1.0;
// ZOOM最大値
const MAX_ZOOM = 2.5;
// ZOOM最小値
const MIN_ZOOM = 1.0;
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
const MOUSE_WHEEL_ZOOM_STEP = 0.1;

/**
 * 路線図ダイアログコンポーネント
 * @returns {React.JSX.Element} 路線図ダイアログコンポーネント
 */
const RoutemapDialog: React.FC = (): React.JSX.Element => {
    const { eventCode } = useParams();

    const { stations, isInitDataLoading, contextError } = useEventContext();

    const [teamData, setTeamData] = useState<TeamData[]>([]);
    const [nextGoalStation, setNextGoalStation] = useState<GoalStationsWithRelations | null>(null);
    const [bombiiTeam, setBombiiTeam] = useState<Teams | null>(null);

    const [aspectRatio, setAspectRatio] = useState<number>(5600 / 4000);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [visibleTeams, setVisibleTeams] = useState<string[]>([]);
    const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
    const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
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
            if (
                !Array.isArray(teamData) ||
                typeof nextGoalStationData !== "object" ||
                typeof bombiiTeamData !== "object"
            ) {
                throw new Error("Unexpected response structure");
            }
            setTeamData(teamData as TeamData[]);
            setNextGoalStation(nextGoalStationData as GoalStationsWithRelations);
            setBombiiTeam(bombiiTeamData as Teams);

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
    }, [fetchData, isOpen]);

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
     * スクロール位置の更新
     */
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement;
        setScrollPosition({ x: target.scrollLeft, y: target.scrollTop });
    }, []);

    /**
     * ズームレベル変更時のスクロール位置調整
     */
    const handleZoomChange = useCallback(
        (newZoomLevel: number) => {
            if (dialogContentRef.current) {
                const container = dialogContentRef.current.querySelector("[data-scroll-container]") as HTMLDivElement;
                if (container) {
                    const containerRect = container.getBoundingClientRect();
                    const centerX = containerRect.width / 2;
                    const centerY = containerRect.height / 2;

                    // 現在の表示中央の実際の座標を計算（center centerの場合）
                    const currentCenterX = (scrollPosition.x + centerX) / zoomLevel;
                    const currentCenterY = (scrollPosition.y + centerY) / zoomLevel;

                    setZoomLevel(newZoomLevel);

                    // 次のフレームでスクロール位置を調整
                    requestAnimationFrame(() => {
                        // 新しいズームレベルでの必要なスクロール位置を計算
                        const newScrollX = currentCenterX * newZoomLevel - centerX;
                        const newScrollY = currentCenterY * newZoomLevel - centerY;

                        container.scrollTo(newScrollX, newScrollY);
                    });
                }
            }
        },
        [scrollPosition, zoomLevel]
    );

    /**
     * ホイールイベントリスナーの設定（passive: falseで）
     */
    useEffect(() => {
        const dialogContent = dialogContentRef.current;
        if (!dialogContent) return;

        const wheelHandler = (e: WheelEvent) => {
            if (e.ctrlKey) {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -MOUSE_WHEEL_ZOOM_STEP : MOUSE_WHEEL_ZOOM_STEP;
                const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + delta));
                handleZoomChange(newZoom);
            }
        };

        dialogContent.addEventListener("wheel", wheelHandler, { passive: false });

        return () => {
            dialogContent.removeEventListener("wheel", wheelHandler);
        };
    }, [zoomLevel, handleZoomChange]);

    /**
     * ズームイン
     */
    const handleZoomIn = (): void => {
        const newZoom = Math.min(zoomLevel + ZOOM_STEP, MAX_ZOOM);
        handleZoomChange(newZoom);
    };

    /**
     * ズームアウト
     */
    const handleZoomOut = (): void => {
        const newZoom = Math.max(zoomLevel - ZOOM_STEP, MIN_ZOOM);
        handleZoomChange(newZoom);
    };

    /**
     * ズームリセット
     */
    const handleZoomReset = () => {
        setZoomLevel(DEFAULT_ZOOM);
    };

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
            {!isLoading && !isInitDataLoading && !error && !contextError && (
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
                                touchAction: "pinch-zoom", // ピンチズームのみ許可
                                position: "relative",
                                border: "1px solid #000",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                            }}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                        >
                            <Box
                                data-scroll-container
                                sx={{
                                    width: "100%",
                                    height: "100%",
                                    overflow: zoomLevel > 1 ? "auto" : "hidden",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    touchAction: "pan-x pan-y pinch-zoom", // スクロールとピンチズームを許可
                                }}
                                onScroll={handleScroll}
                            >
                                <Box
                                    sx={{
                                        transform: `scale(${zoomLevel})`,
                                        transformOrigin: "25% 25%",
                                        width: zoomLevel > 1 ? `${100 * zoomLevel}%` : "100%",
                                        height: zoomLevel > 1 ? `${100 * zoomLevel}%` : "100%",
                                        aspectRatio: aspectRatio, // viewBoxの比率を維持
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: zoomLevel > 1 ? `${100 / zoomLevel}%` : "100%",
                                            height: zoomLevel > 1 ? `${100 / zoomLevel}%` : "100%",
                                            aspectRatio: aspectRatio,
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
                                                onChange={(_, newValue) => handleZoomChange(newValue as number)}
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
                                    <Grid container spacing={1} mb={0}>
                                        {teamData.map((team) => (
                                            <Grid size={6} key={team.teamCode}>
                                                <FormControlLabel
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
                                                    sx={{
                                                        display: "block",
                                                        mb: 1,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
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
