"use client";

import CustomButton from "@/components/base/CustomButton";
import PageTitle from "@/components/base/PageTitle";
import CurrentLocationForm from "@/components/composite/form/CurrentLocationForm";
import { ClosestStation } from "@/types/ClosestStation";
import { CurrentLocationUtils } from "@/utils/currentLocationUtils";
import { ArrowDropDown, Assignment } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, CircularProgress, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useEventContext } from "../../layout";
import { InitFormResponse } from "@/features/init-form/types";
import { AttendancesWithRelations } from "@/repositories/attendances/AttendancesRepository";

/**
 * フォームページ
 * @returns {React.JSX.Element} フォームページのコンポーネント
 */
const FormPage: React.FC = (): React.JSX.Element => {
    const { eventCode } = useParams();

    const { teams, stations, user, isInitDataLoading, contextError } = useEventContext();

    const [closestStations, setClosestStations] = useState<ClosestStation[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const attendance: AttendancesWithRelations | undefined = user?.attendances?.find((a) => a.eventCode === eventCode);

    /**
     * データの取得
     * @returns {Promise<void>} データ取得の非同期処理
     */
    const fetchData = async (): Promise<void> => {
        try {
            setIsLoading(true);
            setError(null);

            const params = new URLSearchParams();
            params.append("eventCode", eventCode as string);

            try {
                const { latitude, longitude } = await CurrentLocationUtils.getCurrentLocation();
                if (latitude && longitude) {
                    params.append("latitude", latitude.toString());
                    params.append("longitude", longitude.toString());
                }
            } catch (locationError) {
                console.warn("Could not get current location:", locationError);
                // 位置情報が取得できない場合、APIを実行せずに処理終了
                return;
            }

            const response = await fetch("/api/init-form?" + params.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: InitFormResponse = (await response.json()).data;
            const closestStations = data.closestStations || [];

            if (!Array.isArray(closestStations)) {
                throw new Error("Unexpected response structure");
            }
            setClosestStations(closestStations as ClosestStation[]);
        } catch (error) {
            console.error("Error fetching data:", error);
            setError(error instanceof Error ? error.message : "Unknown error");
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
                <PageTitle title="到着報告フォーム" icon={<Assignment sx={{ fontSize: "3.5rem", marginRight: 1 }} />} />
                <Box sx={{ margin: 4 }}>
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
                            <CurrentLocationForm
                                teams={teams}
                                stations={stations}
                                closestStations={closestStations}
                                initialTeamCode={attendance?.teamCode}
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
