"use client";

import { useEventContext } from "@/app/events/EventContext";
import CustomButton from "@/components/base/CustomButton";
import PageTitle from "@/components/base/PageTitle";
import ArrivalGoalStationsFormV3 from "@/components/composite/form/ArrivalGoalStationsFormV3";
import CalculateDistanceToolForm from "@/components/composite/form/CalculateDistanceToolForm";
import PointsTransferFormV3 from "@/components/composite/form/PointsTransferFormV3";
import RegisterBombiiAutoForm from "@/components/composite/form/RegisterBombiiAutoForm";
import RegisterBombiiManualForm from "@/components/composite/form/RegisterBombiiManualForm";
import RegisterGoalStationsFormV3 from "@/components/composite/form/RegisterGoalStationsFormV3";
import RegisterPointsFormV3 from "@/components/composite/form/RegisterPointsFormV3";
import RegisterPropertyPurchasesFormV3 from "@/components/composite/form/RegisterPropertyPurchasesFormV3";
import InformationDialog from "@/components/composite/InformationDialog";
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ApplicationErrorHandler } from "@/error/errorHandler";
import { InitOperationResponse } from "@/features/init-operation/types";
import { Events, StationType } from "@/generated/prisma";
import { checkIsOperatingUser } from "@/lib/auth";
import { UsersWithRelations } from "@/repositories/users/UsersRepository";
import { TeamData } from "@/types/TeamData";
import { Construction } from "@mui/icons-material";
import { Alert, Box, CircularProgress, Divider } from "@mui/material";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";

/**
 * GMツールページ
 */
const ToolsPage: React.FC = (): React.JSX.Element => {
    const { eventCode } = useParams();

    const { teams, stations, nearbyStations, user, event, isInitDataLoading, contextError } = useEventContext();

    const [teamData, setTeamData] = useState<TeamData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    // 初期データを一度でも取得できたか。
    // 取得済みの場合は再取得中・再取得失敗でも表示中の内容を消さない。
    const [hasLoaded, setHasLoaded] = useState<boolean>(false);

    const isOperating: boolean = checkIsOperatingUser(user as UsersWithRelations, event as Events);

    /**
     * データの取得
     * @param {boolean} isBackground - リアルタイム通知による背景更新かどうか。
     *                                 背景更新ではローディング表示に切り替えず、入力中のフォームを維持する。
     * @returns {Promise<void>} データ取得の非同期処理
     */
    const fetchData = useCallback(
        async (isBackground: boolean = false): Promise<void> => {
            try {
                if (!isBackground) {
                    setIsLoading(true);
                }
                setError(null);

                const params = new URLSearchParams();
                params.append("eventCode", eventCode as string);

                const response = await fetch("/api/init-operation?" + params.toString());
                if (!response.ok) {
                    throw ApplicationErrorFactory.createFromResponse(response);
                }

                const data: InitOperationResponse = (await response.json()).data;
                const teamData = data.teamData || [];

                setTeamData(teamData as TeamData[]);
                setHasLoaded(true);
            } catch (error) {
                const appError = ApplicationErrorFactory.normalize(error);
                ApplicationErrorHandler.logError(appError);

                setError(appError.message);
                // 背景更新の失敗で表示中のデータを消さない
                if (!isBackground) {
                    setTeamData([]);
                }
            } finally {
                if (!isBackground) {
                    setIsLoading(false);
                }
            }
        },
        [eventCode]
    );

    /**
     * 初期表示（イベントを切り替えた場合も取得し直す）
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
     * データ更新用ハンドラー
     */
    const handleUpdate = useCallback((): void => {
        const currentScrollY = window.scrollY;

        fetchData().finally(() => {
            // スクロール位置を復元
            setTimeout(() => {
                window.scrollTo({ top: currentScrollY, behavior: "instant" });
            }, 0);
        });
    }, [fetchData]);

    return (
        <>
            {/* サブヘッダーセクション */}
            <Box>
                <PageTitle title="GMツール" icon={<Construction sx={{ fontSize: "3.5rem", marginRight: 1 }} />} />
            </Box>
            {/* コンテンツセクション */}
            <Box>
                {/* ローディング（初回取得時のみ表示を差し替える） */}
                {!hasLoaded && (isLoading || isInitDataLoading) && (
                    <Box sx={{ textAlign: "center", margin: 4 }}>
                        <CircularProgress size={40} color="primary" />
                    </Box>
                )}
                {/* エラー（取得済みの場合は表示を消さず、上部に併記するだけに留める） */}
                {(error || contextError) && (
                    <Box sx={{ margin: 4 }}>
                        <Alert severity="error" action={<CustomButton onClick={() => fetchData()}>再試行</CustomButton>}>
                            {error || contextError}
                        </Alert>
                    </Box>
                )}
                {/* メインコンテンツ */}
                {hasLoaded && (
                    <>
                        <RegisterGoalStationsFormV3
                            stations={stations.filter((station) => station.stationType === StationType.mission)}
                            event={event!} onSubmit={handleUpdate}
                            isOperating={isOperating}
                        />
                        <Divider />
                        <ArrivalGoalStationsFormV3 event={event} teams={teams} stations={stations} onSubmit={handleUpdate} isOperating={isOperating} />
                        <Divider />
                        <RegisterBombiiAutoForm teamData={teamData} event={event!} onSubmit={handleUpdate} isOperating={isOperating} />
                        <Divider />
                        <RegisterPointsFormV3 teams={teams} onSubmit={handleUpdate} isOperating={isOperating} />
                        <Divider />
                        <PointsTransferFormV3 teams={teams} onSubmit={handleUpdate} isOperating={isOperating} />
                        <Divider />
                        <RegisterPropertyPurchasesFormV3
                            teams={teams}
                            stations={stations.filter((station) => station.stationType === StationType.mission)}
                            onSubmit={handleUpdate}
                            isOperating={isOperating}
                        />
                        <Divider />
                        <RegisterBombiiManualForm teams={teams} event={event!} onSubmit={handleUpdate} isOperating={isOperating} />
                        <Divider />
                        <CalculateDistanceToolForm
                            stations={stations}
                            nearbyStations={nearbyStations}
                        />
                        <Divider />
                        <InformationDialog teamData={teamData} />
                    </>
                )}
            </Box>
        </>
    );
};

export default ToolsPage;
