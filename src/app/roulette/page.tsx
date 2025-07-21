"use client";

import CustomButton from "@/components/base/CustomButton";
import PageDescription from "@/components/base/PageDescription";
import PageTitle from "@/components/base/PageTitle";
import RouletteForm from "@/components/composite/form/RouletteForm";
import { LatestTransitStations, Stations, Teams } from "@/generated/prisma";
import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";
import theme from "@/theme";
import { CurrentLocationUtils } from "@/utils/currentLocationUtils";
import { Casino } from "@mui/icons-material";
import { Alert, Box, CircularProgress } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { useEffect, useState } from "react";

export default function RoulettePage() {
    const [teams, setTeams] = useState<Teams[]>([]);
    const [stations, setStations] = useState<Stations[]>([]);
    const [nearbyStations, setNearbyStations] = useState<NearbyStationsWithRelations[]>([]);
    const [latestTransitStations, setLatestTransitStations] = useState<LatestTransitStations[]>([]);
    const [closestStations, setClosestStations] = useState<Stations[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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

            const response = await fetch("/api/init-roulette?" + params.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const teams = data?.data?.teams || data?.teams || [];
            const stations = data?.data?.stations || data?.stations || [];
            const nearbyStations = data?.data?.nearbyStations || data?.nearbyStations || [];
            const latestTransitStations =
                data?.data?.latestTransitStations || data?.latestTransitStations || [];
            const closestStations = data?.data?.closestStations || data?.closestStations || [];

            if (
                !Array.isArray(teams) ||
                !Array.isArray(stations) ||
                !Array.isArray(nearbyStations) ||
                !Array.isArray(latestTransitStations) ||
                !Array.isArray(closestStations)
            ) {
                throw new Error("Unexpected response structure");
            }
            setTeams(teams as Teams[]);
            setStations(stations as Stations[]);
            setNearbyStations(nearbyStations as NearbyStationsWithRelations[]);
            setLatestTransitStations(latestTransitStations as LatestTransitStations[]);
            setClosestStations(closestStations as Stations[]);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError(error instanceof Error ? error.message : "Unknown error");
            setTeams([]);
            setStations([]);
            setNearbyStations([]);
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
            <Box>
                <PageTitle title="駅ルーレット" icon={<Casino sx={{ fontSize: "3.5rem",marginRight: 1 }} />}/>
                <PageDescription>
                    【使い方】
                    <br />
                    １．今いる駅を選択
                    <br />
                    ２．モードを選ぶ
                    <br />
                    ３．スタートボタンを押してルーレットを回す
                    <br />
                    ４．ストップボタンを押して目的地を決定
                </PageDescription>
            </Box>

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
                        <Box sx={{ marginX: 2 }}>
                            <RouletteForm
                                stations={stations}
                                nearbyStations={nearbyStations}
                                latestTransitStations={latestTransitStations}
                                closestStations={closestStations}
                            />
                            <CustomButton onClick={fetchData}>データを再取得</CustomButton>
                        </Box>
                    </>
                )}
            </Box>
        </ThemeProvider>
    );
}
