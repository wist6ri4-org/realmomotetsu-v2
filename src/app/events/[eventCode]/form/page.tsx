"use client";

import CustomButton from "@/components/base/CustomButton";
import PageTitle from "@/components/base/PageTitle";
import CurrentLocationForm from "@/components/composite/form/CurrentLocationForm";
import { ClosestStation } from "@/types/ClosestStation";
import { CurrentLocationUtils } from "@/utils/currentLocationUtils";
import { ArrowDropDown, Assignment, Help } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, CircularProgress, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useEventContext } from "../../layout";
import { AttendancesWithRelations } from "@/repositories/attendances/AttendancesRepository";
import LocationUtils from "@/utils/locationUtils";

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

    // NOTE TSK-37 通信頻度最適化対応でAPIの呼び出しは削除

    /**
     * 初期化処理
     * @returns {Promise<void>} 初期化の非同期処理
     */
    const initialize = async (): Promise<void> => {
        let closestStations: ClosestStation[] = [{ stationCode: stations[0].stationCode || "", distance: 0 }];
        try {
            try {
                setIsLoading(true);
                setError(null);

                const { latitude, longitude } = await CurrentLocationUtils.getCurrentLocation();
                if (latitude && longitude) {
                    closestStations = LocationUtils.calculate(stations, latitude, longitude);
                }
            } catch (locationError) {
                console.warn("Could not get current location:", locationError);
            }
        } catch (error) {
            console.error("Error in initialize:", error);
            setError("初期化に失敗しました。");
        } finally {
            setClosestStations(closestStations);
            setIsLoading(false);
        }
    };

    /**
     * 初期表示
     */
    useEffect(() => {
        initialize();
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
                                <Help sx={{ fontSize: "1.8rem", marginRight: 1 }} />
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
                                ４．移動したら移動先の駅（今いる駅）で送信
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
                        <Alert severity="error" action={<CustomButton onClick={initialize}>再試行</CustomButton>}>
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
