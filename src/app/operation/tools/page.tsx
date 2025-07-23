"use client";

import CustomButton from "@/components/base/CustomButton";
import ArrivalGoalStationsForm from "@/components/composite/form/ArrivalGoalStationsForm";
import PointsExchangeForm from "@/components/composite/form/PointsExchangeForm";
import PointsTransferForm from "@/components/composite/form/PointsTransferForm";
import RegisterGoalStationsForm from "@/components/composite/form/RegisterGoalStationsForm";
import RegisterPointsForm from "@/components/composite/form/RegisterPointsForm";
import { Stations, Teams } from "@/generated/prisma";
import { Alert, Box, CircularProgress, Divider } from "@mui/material";
import { useEffect, useState } from "react";

export default function ToolsPage() {
    const [teams, setTeams] = useState<Teams[]>([]);
    const [stations, setStations] = useState<Stations[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams();
            // TODO イベントコードをセッションから取得する
            params.append("eventCode", "TOKYU_20250517");

            const response = await fetch("/api/init-operation?" + params.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const teams = data?.data?.teams || data?.teams || [];
            const stations = data?.data?.stations || data?.stations || [];

            if (!Array.isArray(teams) || !Array.isArray(stations)) {
                throw new Error("Unexpected response structure");
            }
            setTeams(teams as Teams[]);
            setStations(stations as Stations[]);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError(error instanceof Error ? error.message : "Unknown error");
            setTeams([]);
            setStations([]);
        } finally {
            setIsLoading(false);
        }
    };

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
                        <RegisterPointsForm teams={teams} />
                        <Divider />
                        <PointsTransferForm teams={teams} />
                        <Divider />
                        <PointsExchangeForm teams={teams} />
                    </>
                )}
            </Box>
        </>
    );
}
