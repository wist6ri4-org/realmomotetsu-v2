"use client";

import CustomButton from "@/components/base/CustomButton";
import CurrentLocationForm from "@/components/composite/form/CurrentLocationForm";
import { Stations, Teams } from "@/generated/prisma";
import theme from "@/theme";
import { CurrentLocationUtils } from "@/utils/currentLocationUtils";
import { Alert, Box, CircularProgress } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { useEffect, useState } from "react";

export default function FormPage() {
    const [teams, setTeams] = useState<Teams[]>([]);
    const [stations, setStations] = useState<Stations[]>([]);
    const [closestStations, setClosestStations] = useState<Stations[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * データを取得する関数
     */
    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams();
            // TODO イベントコードをセッションから取得する
            params.append("eventCode", "TOKYU_20250517");

            const { latitude, longitude } = await CurrentLocationUtils.getCurrentLocation();
            if (latitude && longitude) {
                params.append("latitude", latitude.toString());
                params.append("longitude", longitude.toString());
            }

            const response = await fetch("/api/init-form?" + params.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const teams = data?.data?.teams || data?.teams || [];
            const stations = data?.data?.stations || data?.stations || [];
            const closestStations = data?.data?.closestStations || data?.closestStations || [];

            if (
                !Array.isArray(teams) ||
                !Array.isArray(stations) ||
                !Array.isArray(closestStations)
            ) {
                throw new Error("Unexpected response structure");
            }
            setTeams(teams as Teams[]);
            setStations(stations as Stations[]);
            setClosestStations(closestStations as Stations[]);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError(error instanceof Error ? error.message : "Unknown error");
            setTeams([]);
            setStations([]);
            setClosestStations([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <ThemeProvider theme={theme}>
            {/* サブヘッダーセクション */}

            {/* コンテンツセクション */}
            <Box>
                {/* ローディング */}
                {isLoading && (
                    <Box sx={{ textAlign: "center", mb: 4 }}>
                        <CircularProgress size={40} color="primary" />
                    </Box>
                )}
                {/* エラー */}
                {error && (
                    <Box sx={{ mb: 4 }}>
                        <Alert
                            severity="error"
                            action={<CustomButton onClick={fetchData}>再試行</CustomButton>}
                        >
                            {error}
                        </Alert>
                    </Box>
                )}
                {/* データの表示 */}
                {!isLoading && !error && (
                    <>
                        <CurrentLocationForm
                            teams={teams}
                            stations={stations}
                            closestStations={closestStations}
                        />
                    </>
                )}
            </Box>

            {/* サブフッターセクション */}
        </ThemeProvider>
    );
}
