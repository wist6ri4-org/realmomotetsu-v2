"use client";

import CustomButton from "@/components/base/CustomButton";
import PageTitle from "@/components/base/PageTitle";
import RouletteForm from "@/components/composite/form/RouletteForm";
import { LatestTransitStations, Stations } from "@/generated/prisma";
import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";
import { ClosestStation } from "@/types/ClosestStation";
import { CurrentLocationUtils } from "@/utils/currentLocationUtils";
import { ArrowDropDown, Casino } from "@mui/icons-material";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    CircularProgress,
    Typography,
} from "@mui/material";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * 駅ルーレットページ
 */
const RoulettePage: React.FC = (): React.JSX.Element => {
    const { eventCode } = useParams();

    const [stations, setStations] = useState<Stations[]>([]);
    const [nearbyStations, setNearbyStations] = useState<NearbyStationsWithRelations[]>([]);
    const [latestTransitStations, setLatestTransitStations] = useState<LatestTransitStations[]>([]);
    const [closestStations, setClosestStations] = useState<ClosestStation[]>([]);
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
            const stations = data?.data?.stations || data?.stations || [];
            const nearbyStations = data?.data?.nearbyStations || data?.nearbyStations || [];
            const latestTransitStations =
                data?.data?.latestTransitStations || data?.latestTransitStations || [];
            const closestStations = data?.data?.closestStations || data?.closestStations || [];

            if (
                !Array.isArray(stations) ||
                !Array.isArray(nearbyStations) ||
                !Array.isArray(latestTransitStations) ||
                !Array.isArray(closestStations)
            ) {
                throw new Error("Unexpected response structure");
            }
            setStations(stations as Stations[]);
            setNearbyStations(nearbyStations as NearbyStationsWithRelations[]);
            setLatestTransitStations(latestTransitStations as LatestTransitStations[]);
            setClosestStations(closestStations as ClosestStation[]);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError(error instanceof Error ? error.message : "Unknown error");
            setStations([]);
            setNearbyStations([]);
            setClosestStations([]);
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
            <Box>
                <PageTitle
                    title="駅ルーレット"
                    icon={<Casino sx={{ fontSize: "3.5rem", marginRight: 1 }} />}
                />
                <Box sx={{ margin: 4 }}>
                    <Accordion>
                        <AccordionSummary
                            expandIcon={<ArrowDropDown sx={{ fontSize: "2.5rem" }} />}
                        >
                            <Typography variant="body2" fontWeight={700}>
                                使い方
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography variant="body2">
                                １．今いる駅を選択
                                <br />
                                ２．モードを選ぶ
                                <br />
                                ３．スタートボタンを押してルーレットを回す
                                <br />
                                ４．ストップボタンを押して目的地を決定
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                </Box>
            </Box>

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
        </>
    );
};

export default RoulettePage;
