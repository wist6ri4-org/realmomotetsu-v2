/**
 * 目的駅到着処理フォーム(V3)
 */
"use client";

import apiFetch from "@/lib/apiClient";
import AlertDialog from "@/components/base/AlertDialog";
import ConfirmDialog from "@/components/base/ConfirmDialog";
import CustomButton from "@/components/base/CustomButton";
import CustomSelect from "@/components/base/CustomSelect";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { DialogConstants } from "@/constants/dialogConstants";
import { getMessage } from "@/constants/messages";
import { ApplicationErrorFactory } from "@/error/applicationError";
import { Events, Stations, Teams } from "@/generated/prisma";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useSelectInput } from "@/hooks/useSelectInput";
import { TypeConverter } from "@/utils/typeConverter";
import { ApplicationErrorHandler } from "@/error/errorHandler";
import { Box, CircularProgress } from "@mui/material";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import { PostVerifyArrivalGoalStationV3Response, VerifyArrivalGoalStationV3Result } from "@/features/verify/verify-arrival-goal-station-v3/types";
import { PostArrivalGoalStationV3Request, PostArrivalGoalStationV3Response } from "@/features/arrival-goal-station-v3/types";
import { Converter } from "@/utils/converter";

/**
 * ArrivalGoalStationsFormV3コンポーネントのプロパティ型定義
 * @property {Events} event - イベント情報
 * @property {Teams[]} teams - チームのリスト
 * @property {Stations[]} stations - 駅のリスト
 * @property {NearbyStationsWithRelations[]} nearByStations - 近隣駅のリスト
 * @property {() => void} [onSubmit] - フォーム送信後のコールバック関数
 * @property {boolean} isOperating - 操作権限があるかどうか
 */
interface ArrivalGoalStationsFormV3Props {
    event: Events;
    teams: Teams[];
    stations: Stations[];
    onSubmit?: () => void;
    isOperating: boolean;
}

/**
 * 目的駅到着処理フォームコンポーネント
 * @param {ArrivalGoalStationsFormV3Props} props - ArrivalGoalStationsFormV3のプロパティ
 * @return {JSX.Element} - ArrivalGoalStationsFormV3コンポーネント
 */
const ArrivalGoalStationsFormV3: React.FC<ArrivalGoalStationsFormV3Props> = ({
    event,
    teams,
    stations,
    onSubmit,
    isOperating,
}: ArrivalGoalStationsFormV3Props): React.JSX.Element => {
    const params = useParams();
    const eventCode = typeof params.eventCode === "string" ? params.eventCode : "";

    const teamCodeInput = useSelectInput("");

    const { isConfirmOpen, dialogOptions, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();
    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    /**
     * データの登録
     * @param {React.FormEvent<HTMLFormElement>} e - フォームの送信イベント
     * @return {Promise<void>} - 登録処理の完了を示すPromise
     */
    const registerArrivalData = async (e: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        try {
            setIsLoading(true);

            // 処理可否チェック
            const responseValidation = await apiFetch("/api/verify/verify-arrival-goal-station-v3", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventTypeCode: event.eventTypeCode,
                    eventCode: eventCode,
                    teamCode: teamCodeInput.value,
                }),
            });
            const responseValidationJson = await responseValidation.json();
            const responseValidationData: PostVerifyArrivalGoalStationV3Response = (responseValidationJson).data;
            if (!responseValidation.ok) {
                throw ApplicationErrorFactory.createFromErrorBody(responseValidation.status, responseValidationJson);
            }

            // 金額入りの確認ダイアログ（処理可否チェック後に、サーバーで計算した金額を表示する）
            const { stationName: goalStationName, currentPoints, arrivalPoints, consecutiveGoalBonus } =
                responseValidationData;
            const afterPoints = currentPoints + arrivalPoints + consecutiveGoalBonus;
            const confirmMessage =
                "以下の内容で到着処理を行いますか？\n\n" +
                `チーム: ${teams.find((team) => team.teamCode === teamCodeInput.value)?.teamName || "不明"}\n` +
                `目的駅: ${goalStationName}駅\n` +
                `現在の持ち金: ${Converter.convertPointsToYenV3(currentPoints)}\n` +
                `到着賞金: ${Converter.convertPointsToYenV3(arrivalPoints)}\n` +
                `連続ゴールボーナス: ${Converter.convertPointsToYenV3(consecutiveGoalBonus)}\n` +
                `到着後の持ち金: ${Converter.convertPointsToYenV3(afterPoints)}`;
            const isConfirmed = await showConfirmDialog({
                message: confirmMessage,
            });
            if (!isConfirmed) {
                return;
            }

            if (responseValidationData.result === VerifyArrivalGoalStationV3Result.W01_STATION_MISMATCH) {
                const isForceConfirmed = await showConfirmDialog({
                    title: DialogConstants.TITLE.WARNING,
                    message: getMessage("STATION_MISMATCH"),
                    severity: "warning",
                });
                if (!isForceConfirmed) {
                    return;
                }
            }

            // 到着処理
            const responseArrival = await apiFetch("/api/arrival-goal-station-v3", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventTypeCode: event.eventTypeCode,
                    eventCode: eventCode,
                    teamCode: teamCodeInput.value,
                    stations: stations,
                } satisfies PostArrivalGoalStationV3Request),
            });

            if (!responseArrival.ok) {
                throw ApplicationErrorFactory.createFromErrorBody(responseArrival.status, await responseArrival.json());
            }
            const responseArrivalData: PostArrivalGoalStationV3Response = (await responseArrival.json()).data;

            teamCodeInput.reset();

            const completionMessage =
                "目的駅到着処理が完了しました。\n\n" +
                `チーム: ${teams.find((team) => team.teamCode === teamCodeInput.value)?.teamName || "不明"}\n` +
                `賞金: ${Converter.convertPointsToYenV3(responseArrivalData.points)}\n` +
                `連続ゴール数: ${responseArrivalData.consecutiveGoalCount}回\n` +
                `連続ゴールボーナス: ${Converter.convertPointsToYenV3(responseArrivalData.consecutiveGoalBonus ?? 0)}` + "円";
            await showAlertDialog({
                title: DialogConstants.TITLE.REGISTERED,
                message: completionMessage,
            });

            onSubmit?.();

            return;
        } catch (err) {
            const appError = ApplicationErrorFactory.normalize(err);
            ApplicationErrorHandler.logError(appError);

            await showAlertDialog({
                title: DialogConstants.TITLE.ERROR,
                message: `${getMessage("ARRIVAL_GOAL_STATIONS_FAILED")}\n${appError.message}`,
            });
            return;
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * フォームのリセット
     * @return {void}
     */
    const resetForm = (): void => {
        teamCodeInput.reset();
        setIsLoading(false);
    };

    return (
        <>
            <Box>
                <FormTitle title="目的駅到着処理" />
                <FormDescription>
                    目的駅に到着した場合、チームを選択し、到着処理を行なう。
                </FormDescription>
                <Box
                    component="form"
                    border={1}
                    borderRadius={1}
                    onSubmit={registerArrivalData}
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        margin: 2,
                        padding: 2,
                        backgroundColor: "white",
                    }}
                >
                    <Box sx={{ marginBottom: 2 }}>
                        <CustomSelect
                            options={TypeConverter.convertTeamsToSelectOptions(teams)}
                            label="チーム"
                            value={teamCodeInput.value}
                            onChange={teamCodeInput.handleChange}
                            size="small"
                            variant="outlined"
                            required
                            disabled={isLoading}
                            sx={{ minWidth: 200 }}
                        />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <CustomButton
                            type="button"
                            color="light"
                            onClick={resetForm}
                            disabled={isLoading}
                            sx={{ marginRight: 1 }}
                        >
                            リセット
                        </CustomButton>
                        <CustomButton
                            type="submit"
                            disabled={isLoading || !isOperating}
                            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {isLoading ? "送信中..." : !isOperating ? "準備中" : "送信"}
                        </CustomButton>
                    </Box>
                </Box>
            </Box>
            <ConfirmDialog
                isConfirmOpen={isConfirmOpen}
                title={dialogOptions.title}
                message={dialogOptions.message}
                severity={dialogOptions.severity}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
            <AlertDialog
                isAlertOpen={isAlertOpen}
                title={alertOptions.title}
                message={alertOptions.message}
                onOk={handleAlertOk}
                okText={alertOptions.okText}
            />
        </>
    );
};

export default ArrivalGoalStationsFormV3;
