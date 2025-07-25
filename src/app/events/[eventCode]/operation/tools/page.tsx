"use client";

import CustomButton from "@/components/base/CustomButton";
import ArrivalGoalStationsForm from "@/components/composite/form/ArrivalGoalStationsForm";
import MissionFormSenzokuike from "@/components/composite/form/MissionFormSenzokuike";
import PointsExchangeForm from "@/components/composite/form/PointsExchangeForm";
import PointsTransferForm from "@/components/composite/form/PointsTransferForm";
import RegisterBombiiAutoForm from "@/components/composite/form/RegisterBombiiAutoForm";
import RegisterBombiiManualForm from "@/components/composite/form/RegisterBombiiManualForm";
import RegisterGoalStationsForm from "@/components/composite/form/RegisterGoalStationsForm";
import RegisterPointsForm from "@/components/composite/form/RegisterPointsForm";
import InformationDialog from "@/components/composite/InformationDialog";
import { Stations, Teams } from "@/generated/prisma";
import { TeamData } from "@/types/TeamData";
import { Alert, Box, CircularProgress, Divider } from "@mui/material";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * GMツールページ
 */
const ToolsPage: React.FC = (): React.JSX.Element => {
    const { eventCode } = useParams();

    const [teams, setTeams] = useState<Teams[]>([]);
    const [stations, setStations] = useState<Stations[]>([]);
    const [teamData, setTeamData] = useState<TeamData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * データの取得
     */
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams();
            params.append("eventCode", eventCode as string);

            const response = await fetch("/api/init-operation?" + params.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const teams = data?.data?.teams || data?.teams || [];
            const stations = data?.data?.stations || data?.stations || [];
            const teamData = data?.data?.teamData || data?.teamData || [];

            if (!Array.isArray(teams) || !Array.isArray(stations)) {
                throw new Error("Unexpected response structure");
            }
            setTeams(teams as Teams[]);
            setStations(stations as Stations[]);
            setTeamData(teamData as TeamData[]);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError(error instanceof Error ? error.message : "Unknown error");
            setTeams([]);
            setStations([]);
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

    return (
        <>
            {/* サブヘッダーセクション */}

            {/* コンテンツセクション */}
            <Box>
                {/* ローディング */}
                {isLoading && (
                    <Box sx={{ textAlign: "center", margin: 4 }}>
                        <CircularProgress size={40} color="primary" />
                    </Box>
                )}
                {/* エラー */}
                {error && (
                    <Box sx={{ margin: 4 }}>
                        <Alert
                            severity="error"
                            action={<CustomButton onClick={fetchData}>再試行</CustomButton>}
                        >
                            {error}
                        </Alert>
                    </Box>
                )}
                {/* メインコンテンツ */}
                {!isLoading && !error && (
                    <>
                        <RegisterGoalStationsForm stations={stations} />
                        <Divider />
                        <ArrivalGoalStationsForm teams={teams} />
                        <Divider />
                        <RegisterBombiiAutoForm teamData={teamData} />
                        <Divider />
                        <RegisterPointsForm teams={teams} />
                        <Divider />
                        <PointsTransferForm teams={teams} />
                        <Divider />
                        <PointsExchangeForm teams={teams} />
                        <Divider />
                        <RegisterBombiiManualForm teams={teams} />
                        <Divider />
                        <MissionFormSenzokuike />
                        <InformationDialog teamData={teamData} />
                    </>
                )}
            </Box>
        </>
    );
};

export default ToolsPage;
