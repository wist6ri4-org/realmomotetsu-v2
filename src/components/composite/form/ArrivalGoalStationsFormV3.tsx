/**
 * 目的駅到着処理フォーム(V3)
 */
"use client";

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
import CustomRadio, { RadioOption } from "@/components/base/CustomRadio";
import { PostVerifyArrivalGoalStationV3Response, VerifyArrivalGoalStationV3Result } from "@/features/verify/verify-arrival-goal-station-v3/types";
import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";
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

// 物件駅購入の選択肢
enum WillBuyStation {
    YES = 1,
    NO = 0,
}

// 物件駅購入のオプション
const willBuyStationOptions: RadioOption[] = [
    { value: WillBuyStation.YES, label: "する" },
    { value: WillBuyStation.NO, label: "しない" },
];

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
    const [willBuyStationInput, setWillBuyStationInput] = useState<number>(WillBuyStation.YES);

    const { isConfirmOpen, dialogOptions, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();
    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    /**
     * 物件駅購入の選択肢の変更ハンドラー
     * @param {React.ChangeEvent<HTMLInputElement>} event - イベントオブジェクト
     */
    const handleWillBuyStationChange = (event: React.ChangeEvent<HTMLInputElement> | (Event & { target: { value: unknown; name: string } })): void => {
        const newValue = Number(event.target.value) as WillBuyStation;
        setWillBuyStationInput(newValue);
        console.log("選択された物件駅購入の値:", newValue);
    };

    /**
     * データの登録
     * @param {React.FormEvent<HTMLFormElement>} e - フォームの送信イベント
     * @return {Promise<void>} - 登録処理の完了を示すPromise
     */
    const registerArrivalData = async (e: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        const confirmMessage =
            "以下の内容で到着処理を行いますか？\n\n" +
            `チーム: ${teams.find((team) => team.teamCode === teamCodeInput.value)?.teamName || "不明"}\n` +
            `物件駅購入: ${willBuyStationInput === WillBuyStation.YES ? "する" : "しない"}`;
        const isConfirmed = await showConfirmDialog({
            message: confirmMessage,
            confirmButtonColor: "primary",
        });

        if (!isConfirmed) {
            return;
        }

        try {
            setIsLoading(true);

            // 処理可否チェック
            const responseValidation = await fetch("/api/verify/verify-arrival-goal-station-v3", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventTypeCode: event.eventTypeCode,
                    eventCode: eventCode,
                    teamCode: teamCodeInput.value,
                    willPurchase: willBuyStationInput === WillBuyStation.YES,
                }),
            });
            const responseValidationJson = await responseValidation.json();
            const responseValidationData: PostVerifyArrivalGoalStationV3Response = (responseValidationJson).data;
            if (!responseValidation.ok) {
                switch (responseValidationJson.errorCode) {
                    case VerifyArrivalGoalStationV3Result.E01_ALREADY_PURCHASED:
                        await showAlertDialog(
                            {
                                title: DialogConstants.TITLE.ERROR,
                                message: getMessage("ALREADY_PURCHASED"),
                            }
                        );
                        return;
                    case VerifyArrivalGoalStationV3Result.E02_INSUFFICIENT_POINTS:
                        await showAlertDialog(
                            {
                                title: DialogConstants.TITLE.WARNING,
                                message: getMessage("INSUFFICIENT_POINTS"),
                            }
                        );
                        return;
                    default:
                        throw ApplicationErrorFactory.createFromErrorBody(responseValidation.status, responseValidationJson);
                }
            } else if (responseValidationData.result === VerifyArrivalGoalStationV3Result.W01_STATION_MISMATCH) {
                const isForceConfirmed = await showConfirmDialog({
                    title: DialogConstants.TITLE.WARNING,
                    message: getMessage("STATION_MISMATCH"),
                    confirmButtonColor: "warning",
                });
                if (!isForceConfirmed) {
                    return;
                }
            }

            // 到着処理
            const responseArrival = await fetch("/api/arrival-goal-station-v3", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventTypeCode: event.eventTypeCode,
                    eventCode: eventCode,
                    teamCode: teamCodeInput.value,
                    stations: stations,
                    willPurchase: willBuyStationInput === WillBuyStation.YES,
                } satisfies PostArrivalGoalStationV3Request),
            });

            if (!responseArrival.ok) {
                throw ApplicationErrorFactory.createFromErrorBody(responseArrival.status, await responseArrival.json());
            }
            const responseArrivalData: PostArrivalGoalStationV3Response = (await responseArrival.json()).data;

            teamCodeInput.reset();
            setWillBuyStationInput(WillBuyStation.YES);

            const stationName = stations.find((station) => station.stationCode === responseArrivalData?.propertyPurchases?.stationCode)?.name ?? "不明";
            const completionMessage =
                "目的駅到着処理が完了しました。\n\n" +
                `チーム: ${teams.find((team) => team.teamCode === teamCodeInput.value)?.teamName || "不明"}\n` +
                `賞金: ${Converter.convertPointsToYenV3(responseArrivalData.points)}\n` +
                `物件駅購入: ${willBuyStationInput === WillBuyStation.YES
                    ? stationName + "駅 : " + Converter.convertPointsToYenV3(responseArrivalData.purchasePoints ?? 0) + "円"
                    : "しない"}\n` +
                `連続ゴール数: ${responseArrivalData.consecutiveGoalCount}回\n` +
                `連続ゴールボーナス: ${Converter.convertPointsToYenV3(responseArrivalData.consecutiveGoalBonus ?? 0)}` + "円";
            await showAlertDialog({
                title: DialogConstants.TITLE.REGISTERED,
                message: completionMessage,
                buttonColor: "success",
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
        setWillBuyStationInput(WillBuyStation.YES);
        setIsLoading(false);
    };

    return (
        <>
            <Box>
                <FormTitle title="目的駅到着処理" />
                <FormDescription>
                    目的駅に到着した場合、チームと購入希望を選択し、到着処理を行なう。
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
                    <Box sx={{ marginBottom: 2 }}>
                        <CustomRadio
                            options={willBuyStationOptions}
                            value={willBuyStationInput}
                            onChange={handleWillBuyStationChange}
                            size="small"
                            label="物件駅を購入"
                            row={true}
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
                confirmButtonColor={dialogOptions.confirmButtonColor}
                cancelButtonColor={dialogOptions.cancelButtonColor}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
            <AlertDialog
                isAlertOpen={isAlertOpen}
                title={alertOptions.title}
                message={alertOptions.message}
                buttonColor={alertOptions.buttonColor}
                onOk={handleAlertOk}
                okText={alertOptions.okText}
            />
        </>
    );
};

export default ArrivalGoalStationsFormV3;
