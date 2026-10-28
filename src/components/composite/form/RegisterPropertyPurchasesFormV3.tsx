/**
 * 物件駅登録フォーム
 */
"use client";

import apiFetch from "@/lib/apiClient";
import AlertDialog from "@/components/base/AlertDialog";
import ConfirmDialog from "@/components/base/ConfirmDialog";
import CustomAutoComplete from "@/components/base/CustomAutoComplete";
import CustomButton from "@/components/base/CustomButton";
import CustomSelect from "@/components/base/CustomSelect";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { GameConstants } from "@/constants/gameConstants";
import { DialogConstants } from "@/constants/dialogConstants";
import { ErrorCodes } from "@/constants/errorCodes";
import { getMessage } from "@/constants/messages";
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ApplicationErrorHandler } from "@/error/errorHandler";
import { PostPropertyPurchasesRequest } from "@/features/property-purchases/types";
import { StationGrade, Stations, Teams } from "@/generated/prisma";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useSelectInput } from "@/hooks/useSelectInput";
import { TeamData } from "@/types/TeamData";
import { Converter } from "@/utils/converter";
import { TypeConverter } from "@/utils/typeConverter";
import { Box, CircularProgress, FormControlLabel, Switch, Typography } from "@mui/material";
import { useParams } from "next/navigation";
import { useState } from "react";

interface RegisterPropertyPurchasesFormV3Props {
    teams: Teams[];
    stations: Stations[];
    teamData: TeamData[];
    onSubmit?: () => void;
    isOperating: boolean;
};

/**
 * 物件駅登録フォームコンポーネント
 * @param {RegisterPropertyPurchasesFormV3Props} props - RegisterPropertyPurchasesFormV3のプロパティ
 * @returns {JSX.Element} - RegisterPropertyPurchasesFormV3コンポーネント
 */
const RegisterPropertyPurchasesFormV3: React.FC<RegisterPropertyPurchasesFormV3Props> = ({
    teams,
    stations,
    teamData,
    onSubmit,
    isOperating,
}: RegisterPropertyPurchasesFormV3Props): React.JSX.Element => {
    const params = useParams();
    const eventCode = typeof params.eventCode === "string" ? params.eventCode : "";

    const teamCodeInput = useSelectInput("");
    const stationCodeInput = useSelectInput("");

    const { isConfirmOpen, dialogOptions, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();
    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [withPayment, setWithPayment] = useState<boolean>(true);

    // 選択中のチーム・駅と、購入金額・現在の持ち金
    const team = teams.find((t) => t.teamCode === teamCodeInput.value);
    const station = stations.find((s) => s.stationCode === stationCodeInput.value);
    const price = GameConstants.STATION_GRADE[station?.stationGrade ?? StationGrade.none].price;
    const currentPoints = teamData.find((t) => t.teamCode === teamCodeInput.value)?.scoredPoints ?? 0;

    const registerPropertyPurchase = async (e: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        // 支払いありの場合は所持金不足をチェック（最終判定はサーバー側）
        if (withPayment && currentPoints - price < 0) {
            await showAlertDialog({
                title: DialogConstants.TITLE.ERROR,
                message: getMessage("INSUFFICIENT_POINTS"),
            });
            return;
        }

        const paymentMessage = withPayment
            ? `支払い: あり\n` +
              `購入金額: ${Converter.convertPointsToYenV3(price)}\n` +
              `現在の持ち金: ${Converter.convertPointsToYenV3(currentPoints)}\n` +
              `支払後の持ち金: ${Converter.convertPointsToYenV3(currentPoints - price)}`
            : `支払い: なし`;
        const confirmMessage =
            `以下の内容で物件駅の購入情報を登録します。よろしいですか？\n\n` +
            `チーム: ${team?.teamName || "不明"}\n` +
            `駅: ${station?.name || "不明"}\n` +
            paymentMessage;
        const isConfirmed = await showConfirmDialog({
            message: confirmMessage,
        });
        if (!isConfirmed) {
            return;
        }

        try {
            setIsLoading(true);

            // 物件駅登録APIを呼び出す
            const response = await apiFetch(`/api/property-purchases`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventCode: eventCode,
                    teamCode: teamCodeInput.value,
                    stationCode: stationCodeInput.value,
                    withPayment: withPayment,
                } satisfies PostPropertyPurchasesRequest),
            });

            // TODO Duplicate entryのエラーハンドリングをRepository層・Service層で行うように修正する
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                const errorMessage: string = typeof errorBody?.error === "string" ? errorBody.error : "";

                if (errorMessage.includes("Duplicate entry")) {
                    throw ApplicationErrorFactory.create(ErrorCodes.DUPLICATE_ENTRY, getMessage("DUPLICATE_PROPERTY_PURCHASE"));
                }

                throw ApplicationErrorFactory.createFromErrorBody(response.status, errorBody);
            }

            teamCodeInput.reset();
            stationCodeInput.reset();
            setWithPayment(true);

            await showAlertDialog({
                title: DialogConstants.TITLE.REGISTERED,
                message: getMessage("REGISTER_SUCCESS", { data: "物件駅購入情報" }),
            });

            onSubmit?.();

        } catch (err) {
            const appError = ApplicationErrorFactory.normalize(err);
            ApplicationErrorHandler.logError(appError);

            await showAlertDialog({
                title: DialogConstants.TITLE.ERROR,
                message: `${getMessage("REGISTER_FAILED", { data: "物件駅購入情報" })}\n${appError.message}`,
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
        stationCodeInput.reset();
        setWithPayment(true);
    }

    return (
        <>
            <Box>
                <FormTitle title="物件駅購入" />
                <FormDescription>
                    チームと駅を選択し、物件駅を購入する。
                </FormDescription>
                <Box
                    component="form"
                    border={1}
                    borderRadius={1}
                    onSubmit={registerPropertyPurchase}
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
                        <CustomAutoComplete
                            options={TypeConverter.convertStationsToAutoCompleteOptions(stations)}
                            value={stationCodeInput.value}
                            onChange={stationCodeInput.handleChange}
                            size="small"
                            variant="outlined"
                            label="購入する駅"
                            required
                            disabled={isLoading}
                            sx={{ minWidth: 200 }}
                        />
                        {station && (
                            <Typography variant="body2" sx={{ marginTop: 1 }}>
                                購入金額: {Converter.convertPointsToYenV3(price)}
                                {team && ` ／ 現在の持ち金: ${Converter.convertPointsToYenV3(currentPoints)}`}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ marginBottom: 2 }}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={withPayment}
                                    onChange={(e) => setWithPayment(e.target.checked)}
                                    disabled={isLoading}
                                />
                            }
                            label={withPayment ? "支払いあり" : "支払いなし"}
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
    )
}

export default RegisterPropertyPurchasesFormV3