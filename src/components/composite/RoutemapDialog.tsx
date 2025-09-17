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
    Stack,
    Grid,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import CustomButton from "../base/CustomButton";
import Routemap from "./Routemap";
import { useParams } from "next/navigation";
import { InitRoutemapResponse } from "@/features/init-routemap/types";
import { Teams } from "@/generated/prisma";
import { useEventContext } from "@/app/events/layout";

// ズーム設定定数
const ZOOM_CONFIG = {
    initialScale: 1,
    minScale: 1,
    maxScale: 4,
    stepSize: 0.4, // 固定ステップサイズ
    wheelStep: 0.2, // マウスホイールのステップサイズ (0.1-1.0の範囲)
} as const;

/**
 * 路線図ダイアログコンポーネント
 * @returns {React.JSX.Element} 路線図ダイアログコンポーネント
 */
const RoutemapDialog: React.FC = React.memo((): React.JSX.Element => {
    const { eventCode } = useParams();

    const { stations, isInitDataLoading, contextError } = useEventContext();

    const [teamData, setTeamData] = useState<TeamData[]>([]);
    const [nextGoalStation, setNextGoalStation] = useState<GoalStationsWithRelations | null>(null);
    const [bombiiTeam, setBombiiTeam] = useState<Teams | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isOpen, setIsOpen] = useState(false);
    const [visibleTeams, setVisibleTeams] = useState<string[]>([]);
    const [currentScale, setCurrentScale] = useState<number>(ZOOM_CONFIG.initialScale);

    /**
     * ボタン無効化のためのスケール追跡コールバック
     */
    const handleTransformed = useCallback(
        (ref: unknown, state: { scale: number }) => {
            // ボタンの無効化判定のためスケール変化時のみ更新
            if (Math.abs(state.scale - currentScale) > 0.01) {
                setCurrentScale(state.scale);
            }
        },
        [currentScale]
    );

    /**
     * Routemap コンポーネントのpropsをメモ化
     */
    const routemapProps = useMemo(
        () => ({
            teamData,
            nextGoalStation,
            bombiiTeam,
            stationsFromDB: stations,
            visibleTeams,
        }),
        [teamData, nextGoalStation, bombiiTeam, stations, visibleTeams]
    );
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
    const handleOpen = useCallback((): void => {
        setIsOpen(true);
    }, []);

    /**
     * ダイアログを閉じるハンドラー
     */
    const handleClose = useCallback((): void => {
        setIsOpen(false);
    }, []);

    /**
     * チーム表示切り替えハンドラー
     * @param teamCode チームコード
     */
    const handleTeamVisibilityToggle = useCallback((teamCode: string): void => {
        setVisibleTeams((prev) =>
            prev.includes(teamCode) ? prev.filter((code) => code !== teamCode) : [...prev, teamCode]
        );
    }, []);

    return (
        <>
            {/* データの表示 */}
            <Fab color="primary" aria-label="info" onClick={handleOpen} sx={{ zIndex: 400 }}>
                <MapIcon />
            </Fab>
            {!isLoading && !isInitDataLoading && !error && !contextError && (
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
                        sx={{
                            padding: 0,
                            overflow: "hidden",
                            position: "relative",
                            border: "1px solid #000",
                        }}
                    >
                        <TransformWrapper
                            initialScale={ZOOM_CONFIG.initialScale}
                            minScale={ZOOM_CONFIG.minScale}
                            maxScale={ZOOM_CONFIG.maxScale}
                            wheel={{
                                step: ZOOM_CONFIG.wheelStep,
                                wheelDisabled: false,
                                touchPadDisabled: false,
                            }}
                            doubleClick={{ disabled: false }}
                            limitToBounds={true}
                            centerOnInit={true}
                            smooth={true}
                            onTransformed={handleTransformed}
                        >
                            {({ resetTransform, zoomIn, zoomOut }) => (
                                <>
                                    <TransformComponent
                                        wrapperStyle={{
                                            width: "100%",
                                            height: "100%",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                        }}
                                        contentStyle={{
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            width: "100%",
                                            height: "100%",
                                        }}
                                    >
                                        <Routemap {...routemapProps} />
                                    </TransformComponent>
                                    {/* ズームコントロール */}
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            bottom: 16,
                                            right: 16,
                                            zIndex: 1000,
                                        }}
                                    >
                                        <Paper elevation={3} sx={{ p: 1 }}>
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                <IconButton
                                                    onClick={() => {
                                                        // 固定ステップでズームアウト
                                                        zoomOut(ZOOM_CONFIG.stepSize, 200);
                                                    }}
                                                    size="medium"
                                                    disabled={currentScale <= ZOOM_CONFIG.minScale}
                                                >
                                                    <ZoomOutIcon sx={{ fontSize: 25 }} />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => {
                                                        // 固定ステップでズームイン
                                                        zoomIn(ZOOM_CONFIG.stepSize, 200);
                                                    }}
                                                    size="medium"
                                                    disabled={currentScale >= ZOOM_CONFIG.maxScale}
                                                >
                                                    <ZoomInIcon sx={{ fontSize: 25 }} />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() => resetTransform()}
                                                    size="medium"
                                                    title="100%にリセット"
                                                    disabled={Math.abs(currentScale - ZOOM_CONFIG.initialScale) < 0.01}
                                                >
                                                    <RestartAltIcon sx={{ fontSize: 25 }} />
                                                </IconButton>
                                            </Box>
                                        </Paper>
                                    </Box>
                                </>
                            )}
                        </TransformWrapper>
                    </DialogContent>
                    <DialogActions sx={{ p: 1 }}>
                        <Stack spacing={2} width="100%">
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
                                                                backgroundColor: visibleTeams.includes(team.teamCode)
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
            )}
        </>
    );
});

RoutemapDialog.displayName = "RoutemapDialog";

export default RoutemapDialog;
