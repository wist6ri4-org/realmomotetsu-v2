/**
 * 目的駅登録フォーム
 */
"use client";

import AlertDialog from "@/components/base/AlertDialog";
import ConfirmDialog from "@/components/base/ConfirmDialog";
import CustomButton from "@/components/base/CustomButton";
import CustomSelect from "@/components/base/CustomSelect";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { DialogConstants } from "@/constants/dialogConstants";
import { DiscordNotificationTemplates } from "@/constants/discordNotificationTemplates";
import { Stations } from "@/generated/prisma";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useDiscordNotification } from "@/hooks/useDiscordNotification";
import { useSelectInput } from "@/hooks/useSelectInput";
import { TypeConverter } from "@/utils/typeConverter";
import { Box, CircularProgress } from "@mui/material";
import { useParams } from "next/navigation";
import React, { useState } from "react";

/**
 * RegisterGoalStationsFormコンポーネントのプロパティ型定義
 * @property {Stations[]} stations - 駅のリスト
 * @property {() => void} [onFormSubmit] - フォーム送信後のコールバック関数
 */
interface RegisterGoalStationsFormProps {
    stations: Stations[];
    onSubmit?: () => void;
}

/**
 * 目的駅登録フォームコンポーネント
 * @param {RegisterGoalStationsFormProps} props - RegisterGoalStationsFormのプロパティ
 * @returns {JSX.Element} - RegisterGoalStationsFormコンポーネント
 */
const RegisterGoalStationsForm: React.FC<RegisterGoalStationsFormProps> = ({
    stations,
    onSubmit,
}: RegisterGoalStationsFormProps): React.JSX.Element => {
    const { eventCode } = useParams();

    const stationCodeInput = useSelectInput("");

    const { isConfirmOpen, dialogOptions, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();
    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const { sendNotification, clearError } = useDiscordNotification();

    /**
     * Discord通知を送信する
     * @description
     * 目的駅登録時
     */
    const notifyToDiscord = async (): Promise<void> => {
        await sendNotification({
            templateName: DiscordNotificationTemplates.REGISTER_GOAL_STATION,
            variables: {
                stationName: stations.find((station) => station.stationCode === stationCodeInput.value)?.name || "不明",
            },
        });
    };

    /**
     * データの登録
     * @param {React.FormEvent<HTMLFormElement>} e - フォームの送信イベント
     * @returns {Promise<void>} - 登録処理の完了を示すPromise
     */
    const registerGoalStation = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        clearError();

        const confirmMessage =
            "以下の内容で登録しますか？\n" +
            `駅: ${stations.find((station) => station.stationCode === stationCodeInput.value)?.name || "不明"}`;

        const isConfirmed = await showConfirmDialog({
            message: confirmMessage,
        });

        if (!isConfirmed) {
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // 目的駅の登録
            const response = await fetch("/api/goal-stations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventCode: eventCode,
                    stationCode: stationCodeInput.value,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            stationCodeInput.reset();

            notifyToDiscord();

            await showAlertDialog({
                title: DialogConstants.TITLE.REGISTERED,
                message: "目的駅の登録が完了しました。",
            });

            onSubmit?.();

            return;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            await showAlertDialog({
                title: DialogConstants.TITLE.ERROR,
                message: `目的駅の登録に失敗しました。\n${error}`,
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
        stationCodeInput.reset();
        setIsLoading(false);
        setError(null);
    };

    return (
        <>
            <Box>
                <FormTitle title="目的駅登録" />
                <FormDescription>次の目的駅を登録する。</FormDescription>
                <Box
                    component="form"
                    border={1}
                    borderRadius={1}
                    onSubmit={registerGoalStation}
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
                            options={TypeConverter.convertStationsToSelectOptions(stations)}
                            label="目的駅"
                            value={stationCodeInput.value}
                            onChange={stationCodeInput.handleChange}
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
                            disabled={isLoading}
                            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {isLoading ? "送信中..." : "送信"}
                        </CustomButton>
                    </Box>
                </Box>
            </Box>
            <ConfirmDialog
                isConfirmOpen={isConfirmOpen}
                title={dialogOptions.title}
                message={dialogOptions.message}
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

export default RegisterGoalStationsForm;
