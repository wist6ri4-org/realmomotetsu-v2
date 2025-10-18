/**
 * ボンビー手動設定フォーム
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
import { getMessage } from "@/constants/messages";
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ApplicationErrorHandler } from "@/error/errorHandler";
import { Events, Teams } from "@/generated/prisma";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useDiscordNotification } from "@/hooks/useDiscordNotification";
import { useSelectInput } from "@/hooks/useSelectInput";
import { TypeConverter } from "@/utils/typeConverter";
import { Box, CircularProgress } from "@mui/material";
import { useParams } from "next/navigation";
import React, { useState } from "react";

/**
 * RegisterBombiiManualFormコンポーネントのプロパティ型定義
 * @property {Teams[]} teams - チームのリスト
 * @property {Events} event - イベント情報
 * @property {() => void} [onSubmit] - フォーム送信後のコールバック関数
 * @property {boolean} isOperating - 操作権限があるかどうか
 */
interface RegisterBombiiManualFormProps {
    teams: Teams[];
    event: Events;
    onSubmit?: () => void;
    isOperating: boolean;
}

/**
 * ボンビー手動設定フォームコンポーネント
 * @param {RegisterBombiiManualFormProps} props - RegisterBombiiManualFormのプロパティ
 * @returns {JSX.Element} - RegisterBombiiManualFormコンポーネント
 */
const RegisterBombiiManualForm: React.FC<RegisterBombiiManualFormProps> = ({
    teams,
    event,
    onSubmit,
    isOperating,
}: RegisterBombiiManualFormProps): React.JSX.Element => {
    const { eventCode } = useParams();

    const teamCodeInput = useSelectInput("");

    const { isConfirmOpen, dialogOptions, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();
    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { sendNotification, clearError } = useDiscordNotification();

    /**
     * Discord通知を送信する
     * @description
     * ボンビー登録時
     */
    const notifyToDiscord = async (): Promise<void> => {
        await sendNotification({
            discordWebhookUrl: event.discordWebhookUrl,
            templateName: DiscordNotificationTemplates.REGISTER_BOMBII,
            variables: {
                teamName: teams.find((team) => team.teamCode === teamCodeInput.value)?.teamName || "不明",
            },
        });
    };

    /**
     * データの登録
     * @param {React.FormEvent<HTMLFormElement>} e - フォームの送信イベント
     * @return {Promise<void>} - 登録処理の完了を示すPromise
     */
    const registerBombiiData = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        clearError();

        const confirmMessage =
            "以下の内容でボンビーを登録しますか？\n" +
            `チーム: ${teams.find((team) => team.teamCode === teamCodeInput.value)?.teamName || "不明"}`;
        const isConfirmed = await showConfirmDialog({
            message: confirmMessage,
        });

        if (!isConfirmed) {
            return;
        }

        try {
            setIsLoading(true);

            // ボンビーを登録
            const response = await fetch("/api/bombii-histories", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventCode: eventCode,
                    teamCode: teamCodeInput.value,
                }),
            });

            if (!response.ok) {
                throw ApplicationErrorFactory.createFromResponse(response);
            }

            teamCodeInput.reset();

            if (event.isNotificationEnabled && event.discordWebhookUrl) {
                notifyToDiscord();
            }

            await showAlertDialog({
                title: DialogConstants.TITLE.REGISTERED,
                message: getMessage("REGISTER_SUCCESS", { data: "ボンビー" }),
            });

            onSubmit?.();

            return;
        } catch (err) {
            const appError = ApplicationErrorFactory.normalize(err);
            ApplicationErrorHandler.logError(appError);

            await showAlertDialog({
                title: DialogConstants.TITLE.ERROR,
                message: `${getMessage("REGISTER_FAILED", { data: "ボンビー" })}\n${appError.message}`,
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
        clearError();
        setIsLoading(false);
    };

    return (
        <>
            <Box>
                <FormTitle title="ボンビー手動設定" />
                <FormDescription>ボンビー対象のチームを手動で選択し、設定する。</FormDescription>
                <Box
                    component="form"
                    border={1}
                    borderRadius={1}
                    onSubmit={registerBombiiData}
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

export default RegisterBombiiManualForm;
