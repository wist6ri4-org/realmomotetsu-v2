"use client";

import { useEventContext } from "@/app/events/layout";
import CustomButton from "@/components/base/CustomButton";
import PageTitle from "@/components/base/PageTitle";
import ArrivalGoalStationsForm from "@/components/composite/form/ArrivalGoalStationsForm";
import MissionFormSenzokuike from "@/components/composite/form/MissionFormSenzokuike";
import PointsExchangeForm from "@/components/composite/form/PointsExchangeForm";
import PointsTransferForm from "@/components/composite/form/PointsTransferForm";
import RegisterBombiiAutoForm from "@/components/composite/form/RegisterBombiiAutoForm";
import RegisterBombiiManualForm from "@/components/composite/form/RegisterBombiiManualForm";
import RegisterGoalStationsForm from "@/components/composite/form/RegisterGoalStationsForm";
import RegisterPointsForm from "@/components/composite/form/RegisterPointsForm";
import InformationDialog from "@/components/composite/InformationDialog";
import { InitOperationResponse } from "@/features/init-operation/types";
import { TeamData } from "@/types/TeamData";
import { Construction } from "@mui/icons-material";
import { Alert, Box, CircularProgress, Divider } from "@mui/material";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/**
 * GMツールページ
 */
const ToolsPage: React.FC = (): React.JSX.Element => {
    const { eventCode } = useParams();

    const { teams, stations, isInitDataLoading, contextError } = useEventContext();

    const [teamData, setTeamData] = useState<TeamData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * データの取得
     * @returns {Promise<void>} データ取得の非同期処理
     */
    const fetchData = useCallback(async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams();
            params.append("eventCode", eventCode as string);

            const response = await fetch("/api/init-operation?" + params.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: InitOperationResponse = (await response.json()).data;
            const teamData = data.teamData || [];

            if (!Array.isArray(teamData)) {
                throw new Error("Unexpected response structure");
            }
            setTeamData(teamData as TeamData[]);
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
    }, []);

    /**
     * データ更新用ハンドラー
     */
    const handleUpdate = (): void => {
        fetchData();
    };

    return (
        <>
            {/* サブヘッダーセクション */}
            <Box>
                <PageTitle title="GMツール" icon={<Construction sx={{ fontSize: "3.5rem", marginRight: 1 }} />} />
            </Box>
            {/* コンテンツセクション */}
            <Box>
                {/* ローディング */}
                {(isLoading || isInitDataLoading) && (
                    <Box sx={{ textAlign: "center", margin: 4 }}>
                        <CircularProgress size={40} color="primary" />
                    </Box>
                )}
                {/* エラー */}
                {(error || contextError) && (
                    <Box sx={{ margin: 4 }}>
                        <Alert severity="error" action={<CustomButton onClick={fetchData}>再試行</CustomButton>}>
                            {error}
                        </Alert>
                    </Box>
                )}
                {/* メインコンテンツ */}
                {!isLoading && !isInitDataLoading && !error && !contextError && (
                    <>
                        <RegisterGoalStationsForm stations={stations} onSubmit={handleUpdate} />
                        <Divider />
                        <ArrivalGoalStationsForm teams={teams} onSubmit={handleUpdate} />
                        <Divider />
                        <RegisterBombiiAutoForm teamData={teamData} onSubmit={handleUpdate} />
                        <Divider />
                        <RegisterPointsForm teams={teams} onSubmit={handleUpdate} />
                        <Divider />
                        <PointsTransferForm teams={teams} onSubmit={handleUpdate} />
                        <Divider />
                        <PointsExchangeForm teams={teams} onSubmit={handleUpdate} />
                        <Divider />
                        <RegisterBombiiManualForm teams={teams} onSubmit={handleUpdate} />
                        <Divider />
                        <MissionFormSenzokuike />
                        <InformationDialog
                            teamData={teamData}
                            eventCode={eventCode as string}
                            onDataUpdate={setTeamData}
                        />
                    </>
                )}
            </Box>
        </>
    );
};

export default ToolsPage;
