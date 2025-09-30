"use client";

import CustomButton from "@/components/base/CustomButton";
import PageTitle from "@/components/base/PageTitle";
import RouletteForm from "@/components/composite/form/RouletteForm";
import { LatestTransitStations } from "@/generated/prisma";
import { ClosestStation } from "@/types/ClosestStation";
import { CurrentLocationUtils } from "@/utils/currentLocationUtils";
import { ArrowDropDown, Casino, Help } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, CircularProgress, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useEventContext } from "../../layout";
import { InitRouletteResponse } from "@/features/init-roulette/types";
import LocationUtils from "@/utils/locationUtils";
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ApplicationErrorHandler } from "@/error/errorHandler";

/**
 * 駅ルーレットページ
 */
const RoulettePage: React.FC = (): React.JSX.Element => {
    const { eventCode } = useParams();

    const { stations, nearbyStations, isInitDataLoading, contextError } = useEventContext();

    const [latestTransitStations, setLatestTransitStations] = useState<LatestTransitStations[]>([]);
    const [closestStations, setClosestStations] = useState<ClosestStation[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * データの取得
     * @return {Promise<void>} データ取得のPromise
     */
    const fetchData = async (): Promise<void> => {
        let closestStations: ClosestStation[] = [{ stationCode: stations[0].stationCode || "", distance: 0 }];
        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams();
            params.append("eventCode", eventCode as string);

            try {
                const { latitude, longitude } = await CurrentLocationUtils.getCurrentLocation();
                if (latitude && longitude) {
                    closestStations = LocationUtils.calculate(stations, latitude, longitude);
                }
            } catch (locationError) {
                console.warn("Could not get current location:", locationError);
            }

            const response = await fetch("/api/init-roulette?" + params.toString());
            if (!response.ok) {
                throw ApplicationErrorFactory.createFromResponse(response);
            }

            const data: InitRouletteResponse = (await response.json()).data;
            const latestTransitStations = data.latestTransitStations || [];

            setLatestTransitStations(latestTransitStations as LatestTransitStations[]);
            setClosestStations(closestStations as ClosestStation[]);
        } catch (error) {
            const appError = ApplicationErrorFactory.normalize(error);
            ApplicationErrorHandler.logError(appError);

            setError(appError.message);
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
                <PageTitle title="駅ルーレット" icon={<Casino sx={{ fontSize: "3.5rem", marginRight: 1 }} />} />
                <Box sx={{ margin: 4 }}>
                    <Accordion>
                        <AccordionSummary expandIcon={<ArrowDropDown sx={{ fontSize: "2.5rem" }} />}>
                            <Typography variant="body2" fontWeight={700}>
                                <Help sx={{ fontSize: "1.8rem", marginRight: 1 }} />
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
                {/* データの表示 */}
                {!isLoading && !isInitDataLoading && !error && !contextError && (
                    <>
                        <Box sx={{ marginX: 2 }}>
                            <RouletteForm
                                stations={stations}
                                nearbyStations={nearbyStations}
                                latestTransitStations={latestTransitStations}
                                closestStations={closestStations}
                            />
                        </Box>
                    </>
                )}
            </Box>
        </>
    );
};

export default RoulettePage;
