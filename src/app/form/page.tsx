"use client";

import CustomButton from "@/components/base/CustomButton";
import PageTitle from "@/components/base/PageTitle";
import CurrentLocationForm from "@/components/composite/form/CurrentLocationForm";
import { Stations, Teams } from "@/generated/prisma";
import { CurrentLocationUtils } from "@/utils/currentLocationUtils";
import { ArrowDropDown, Assignment } from "@mui/icons-material";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Box,
    CircularProgress,
    Typography,
} from "@mui/material";
import { useEffect, useState } from "react";

/**
 * フォームページ
 */
const FormPage: React.FC = (): React.JSX.Element => {
    const [teams, setTeams] = useState<Teams[]>([]);
    const [stations, setStations] = useState<Stations[]>([]);
    const [closestStations, setClosestStations] = useState<Stations[]>([]);
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
                    title="到着報告フォーム"
                    icon={<Assignment sx={{ fontSize: "3.5rem", marginRight: 1 }} />}
                />
                <Accordion>
                    <AccordionSummary expandIcon={<ArrowDropDown sx={{ fontSize: "2.5rem" }} />}>
                        <Typography variant="body2" fontWeight={700}>
                            いつ送る？
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography variant="body2">
                            １．サイコロを２回振ってカードを決定
                            <br />
                            ２．カードの効果を処理する
                            <br />
                            ３．もう一度サイコロを振って行き先を決定
                            <br />
                            ４．移動したら移動先の駅（今いる駅）をこのフォームから送信
                            <br />
                            ５．１～４を繰り返す
                        </Typography>
                    </AccordionDetails>
                </Accordion>
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
                            <CurrentLocationForm
                                teams={teams}
                                stations={stations}
                                closestStations={closestStations}
                            />
                        </Box>
                    </>
                )}
            </Box>

            {/* サブフッターセクション */}
        </>
    );
};

export default FormPage;
