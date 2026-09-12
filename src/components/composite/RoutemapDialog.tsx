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
import { useEventContext } from "@/app/events/EventContext";
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ApplicationErrorHandler } from "@/error/errorHandler";
import { PropertyPurchasesForRoutemap } from "@/repositories/propertyPurchases/PropertyPurchasesRepository";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";

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

    const { stations, event, isInitDataLoading, contextError } = useEventContext();

    const [teamData, setTeamData] = useState<TeamData[]>([]);
    const [nextGoalStation, setNextGoalStation] = useState<GoalStationsWithRelations | null>(null);
    const [bombiiTeam, setBombiiTeam] = useState<Teams | null>(null);
    const [propertyPurchases, setPropertyPurchases] = useState<PropertyPurchasesForRoutemap[]>([]);

    // 初期データを一度でも取得できたか。
    // 取得済みの場合は再取得中・再取得失敗でもダイアログをアンマウントしない
    // （アンマウントするとズーム/パン位置やチーム表示設定が失われるため）。
    const [hasLoaded, setHasLoaded] = useState<boolean>(false);

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
            propertyPurchases,
            stationsFromDB: stations,
            visibleTeams,
            configFileName: event?.eventType?.routemapConfigFile || "routemap-config",
        }),
        [teamData, nextGoalStation, bombiiTeam, propertyPurchases, stations, visibleTeams]
    );
    /**
     * データの取得
     * @param {boolean} isBackground - リアルタイム通知による背景更新かどうか。
     *                                 背景更新ではローディング表示に切り替えず、表示中の内容と操作状態を維持する。
     */
    const fetchData = useCallback(
        async (isBackground: boolean = false) => {
            try {
                const params = new URLSearchParams();
                params.append("eventCode", eventCode as string);

                const response = await fetch("/api/init-routemap?" + params.toString());
                if (!response.ok) {
                    throw ApplicationErrorFactory.createFromErrorBody(response.status, await response.json());
                }

                const data: InitRoutemapResponse = (await response.json()).data;
                const teamData = data?.teamData || [];
                const nextGoalStationData = data?.nextGoalStation || {};
                const bombiiTeamData = data?.bombiiTeam || {};
                const propertyPurchases = data?.propertyPurchases || [];

                setTeamData(teamData as TeamData[]);
                setNextGoalStation(nextGoalStationData as GoalStationsWithRelations);
                setBombiiTeam(bombiiTeamData as Teams);
                setPropertyPurchases(propertyPurchases as PropertyPurchasesForRoutemap[]);

                // 初期表示では全チームを表示する。
                // 背景更新でここを通すとユーザーのチーム表示設定が戻ってしまうため、初回のみ設定する。
                if (!isBackground) {
                    setVisibleTeams((teamData as TeamData[]).map((team) => team.teamCode));
                }
                setHasLoaded(true);
            } catch (error) {
                const appError = ApplicationErrorFactory.normalize(error);
                ApplicationErrorHandler.logError(appError);

                // 背景更新の失敗で表示中のデータを消さない
                if (!isBackground) {
                    setTeamData([]);
                }
            }
        },
        [eventCode]
    );

    /**
     * 初期表示。
     * 以前は依存に`isOpen`を含めており開閉のたびに再取得していたが、
     * リアルタイム更新に置き換えたため除外する。
     * このコンポーネントはレイアウトに常駐し、イベントを切り替えても再マウントされないため、
     * `eventCode`に依存する`fetchData`を依存に残して切り替え時には取得し直す。
     */
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    /**
     * リアルタイム通知による背景更新
     */
    const handleRealtimeRefresh = useCallback((): void => {
        fetchData(true);
    }, [fetchData]);

    useRealtimeRefresh(eventCode as string, handleRealtimeRefresh);

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
            {hasLoaded && !isInitDataLoading && !contextError && (
                <Dialog
                    open={isOpen}
                    onClose={handleClose}
                    aria-labelledby="routemap-dialog-title"
                    aria-describedby="routemap-dialog-description"
                    fullScreen
                    sx={{ zIndex: 500 }}
                >
                    <DialogTitle id="routemap-dialog-title">
                        <MapIcon sx={{ fontSize: "2rem", marginRight: 1 }} />
                        路線図
                    </DialogTitle>
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
                            maxScale={routemapProps.configFileName?.includes("tokyu") ? ZOOM_CONFIG.maxScale : 5}
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
                                            zIndex: 600,
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
                            <Box sx={{ display: "flex", justifyContent: "flex-end", width: "100%", paddingBottom: 4 }}>
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
