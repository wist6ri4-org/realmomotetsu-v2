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
import { Teams } from "@/generated/prisma";
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
 */
interface RegisterBombiiManualFormProps {
    teams: Teams[];
}

/**
 * ボンビー手動設定フォームコンポーネント
 * @param {RegisterBombiiManualFormProps} props - RegisterBombiiManualFormのプロパティ
 * @returns {JSX.Element} - RegisterBombiiManualFormコンポーネント
 */
const RegisterBombiiManualForm: React.FC<RegisterBombiiManualFormProps> = ({
    teams,
}: RegisterBombiiManualFormProps): React.JSX.Element => {
    const { eventCode } = useParams();

    const teamCodeInput = useSelectInput("");

    const { isConfirmOpen, dialogOptions, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();
    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const { sendNotification, clearError } = useDiscordNotification();

    /**
     * Discord通知を送信する
     * @description
     * ボンビー登録時
     */
    const notifyToDiscord = async (): Promise<void> => {
        await sendNotification({
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
            setError(null);

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
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            teamCodeInput.reset();

            notifyToDiscord();
            await showAlertDialog({
                title: DialogConstants.DIALOG_TITLE_REGISTERED,
                message: "ボンビーの登録が完了しました。",
            });
            return;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            await showAlertDialog({
                title: DialogConstants.DIALOG_TITLE_ERROR,
                message: `ボンビーの登録に失敗しました。\n${error}`,
            });
            return;
        } finally {
            setIsLoading(false);
        }
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

export default RegisterBombiiManualForm;
