/**
 * ボンビー自動設定フォーム
 */
"use client";

import AlertDialog from "@/components/base/AlertDialog";
import ConfirmDialog from "@/components/base/ConfirmDialog";
import CustomButton from "@/components/base/CustomButton";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { DialogConstants } from "@/constants/dialogConstants";
import { DiscordNotificationTemplates } from "@/constants/discordNotificationTemplates";
import { getMessage } from "@/constants/messages";
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ApplicationErrorHandler } from "@/error/errorHandler";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useDiscordNotification } from "@/hooks/useDiscordNotification";
import { TeamData } from "@/types/TeamData";
import { GameLogicUtils } from "@/utils/gameLogicUtils";
import { Box, CircularProgress } from "@mui/material";
import { useParams } from "next/navigation";
import React, { useState } from "react";

/**
 * RegisterBombiiAutoFormコンポーネントのプロパティ型定義
 * @property {TeamData[]} teamData - チームデータのリスト
 * @property {() => void} [onSubmit] - フォーム送信後のコールバック関数
 * @property {boolean} isOperating - 操作権限があるかどうか
 */
interface RegisterBombiiAutoFormProps {
    teamData: TeamData[];
    onSubmit?: () => void;
    isOperating: boolean;
}

/**
 * ボンビー自動設定フォームコンポーネント
 * @param {RegisterBombiiAutoFormProps} props - RegisterBombiiAutoFormのプロパティ
 * @returns {JSX.Element} - RegisterBombiiAutoFormコンポーネント
 */
const RegisterBombiiAutoForm: React.FC<RegisterBombiiAutoFormProps> = ({
    teamData,
    onSubmit,
    isOperating,
}: RegisterBombiiAutoFormProps): React.JSX.Element => {
    const { eventCode } = useParams();

    const { isConfirmOpen, dialogOptions, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();
    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    const { sendNotification, clearError } = useDiscordNotification();

    /**
     * Discord通知を送信する
     * @description
     * ボンビー登録時
     */
    const notifyToDiscord = async (teamName: string): Promise<void> => {
        await sendNotification({
            templateName: DiscordNotificationTemplates.REGISTER_BOMBII,
            variables: {
                teamName: teamName,
            },
        });
    };

    /**
     * データの確認と登録
     * @param {React.FormEvent<HTMLFormElement>} e - フォームの送信イベント
     * @returns {Promise<void>} - 登録処理の完了を示すPromise
     */
    const confirmAndRegisterBombii = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        clearError();

        // ボンビーのチームを条件に基づき決定
        const bombiiTeam = GameLogicUtils.confirmBombii(teamData);

        const confirmMessage =
            `以下の内容でボンビーを登録しますか？\n` +
            `チーム: ${bombiiTeam.teamName}\n` +
            `総資産: ${bombiiTeam.scoredPoints}\n` +
            `目的駅までの距離: ${bombiiTeam.remainingStationsNumber}駅`;
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
                    teamCode: bombiiTeam.teamCode,
                }),
            });

            if (!response.ok) {
                throw ApplicationErrorFactory.createFromResponse(response);
            }

            notifyToDiscord(bombiiTeam.teamName);

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

    return (
        <>
            <Box>
                <FormTitle title="ボンビー自動設定" />
                <FormDescription>現時点でのボンビーをチェックし、自動で設定する。</FormDescription>
                <Box
                    component="form"
                    border={1}
                    borderRadius={1}
                    onSubmit={confirmAndRegisterBombii}
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        margin: 2,
                        padding: 2,
                        backgroundColor: "white",
                    }}
                >
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <CustomButton
                            type="submit"
                            disabled={isLoading || !isOperating}
                            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {isLoading ? "送信中..." : !isOperating ? "開催前" : "送信"}
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

export default RegisterBombiiAutoForm;
