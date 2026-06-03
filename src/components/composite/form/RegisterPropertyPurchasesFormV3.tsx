/**
 * 物件駅登録フォーム
 */
"use client";

import AlertDialog from "@/components/base/AlertDialog";
import ConfirmDialog from "@/components/base/ConfirmDialog";
import CustomAutoComplete from "@/components/base/CustomAutoComplete";
import CustomButton from "@/components/base/CustomButton";
import CustomSelect from "@/components/base/CustomSelect";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { DialogConstants } from "@/constants/dialogConstants";
import { ErrorCodes } from "@/constants/errorCodes";
import { getMessage } from "@/constants/messages";
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ApplicationErrorHandler } from "@/error/errorHandler";
import { PostPropertyPurchasesRequest } from "@/features/property-purchases/types";
import { Stations, Teams } from "@/generated/prisma";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useSelectInput } from "@/hooks/useSelectInput";
import { TypeConverter } from "@/utils/typeConverter";
import { Box, CircularProgress } from "@mui/material";
import { useParams } from "next/navigation";
import { useState } from "react";

interface RegisterPropertyPurchasesFormV3Props {
    teams: Teams[];
    stations: Stations[];
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

    const registerPropertyPurchase = async (e: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        const confirmMessage =
            `以下の内容で物件駅の購入情報を登録します。よろしいですか？\n\n` +
            `チーム: ${teams.find((team) => team.teamCode === teamCodeInput.value)?.teamName || "不明"}\n` +
            `駅: ${stations.find((station) => station.stationCode === stationCodeInput.value)?.name || "不明"}`;
        const isConfirmed = await showConfirmDialog({
            message: confirmMessage,
            confirmButtonColor: "primary",
        });
        if (!isConfirmed) {
            return;
        }

        try {
            setIsLoading(true);

            // 物件駅登録APIを呼び出す
            const response = await fetch(`/api/property-purchases`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventCode: eventCode,
                    teamCode: teamCodeInput.value,
                    stationCode: stationCodeInput.value,
                } satisfies PostPropertyPurchasesRequest),
            });

            // TODO Duplicate entryのエラーハンドリングをRepository層・Service層で行うように修正する
            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                const errorMessage: string = typeof errorBody?.error === "string" ? errorBody.error : "";

                if (errorMessage.includes("Duplicate entry")) {
                    throw ApplicationErrorFactory.create(ErrorCodes.DUPLICATE_ENTRY, getMessage("DUPLICATE_PROPERTY_PURCHASE"));
                }

                throw ApplicationErrorFactory.createFromResponse(response);
            }

            teamCodeInput.reset();
            stationCodeInput.reset();

            await showAlertDialog({
                title: DialogConstants.TITLE.REGISTERED,
                message: getMessage("REGISTER_SUCCESS", { data: "物件駅購入情報" }),
                buttonColor: "primary",
            });

            onSubmit?.();

        } catch (err) {
            const appError = ApplicationErrorFactory.normalize(err);
            ApplicationErrorHandler.logError(appError);

            await showAlertDialog({
                title: DialogConstants.TITLE.ERROR,
                message: `${getMessage("REGISTER_FAILED", { data: "物件駅購入情報" })}\n${appError.message}`,
                buttonColor: "error",
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
                            label="今いる駅"
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
    )
}

export default RegisterPropertyPurchasesFormV3