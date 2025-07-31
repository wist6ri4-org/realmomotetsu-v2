/**
 * ボンビー自動設定フォーム
 */
"use client";

import CustomButton from "@/components/base/CustomButton";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { DiscordNotificationTemplates } from "@/constants/discordNotificationTemplates";
import { useDiscordNotification } from "@/hooks/useDiscordNotification";
import { TeamData } from "@/types/TeamData";
import { GameLogicUtils } from "@/utils/gameLogicUtils";
import { Box } from "@mui/material";
import { useParams } from "next/navigation";
import React from "react";

/**
 * RegisterBombiiAutoFormコンポーネントのプロパティ型定義
 * @property {TeamData[]} teamData - チームデータのリスト
 */
interface RegisterBombiiAutoFormProps {
    teamData: TeamData[];
}

/**
 * ボンビー自動設定フォームコンポーネント
 * @param {RegisterBombiiAutoFormProps} props - RegisterBombiiAutoFormのプロパティ
 * @returns {JSX.Element} - RegisterBombiiAutoFormコンポーネント
 */
const RegisterBombiiAutoForm: React.FC<RegisterBombiiAutoFormProps> = ({
    teamData,
}: RegisterBombiiAutoFormProps): React.JSX.Element => {
    const { eventCode } = useParams();

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
     */
    const confirmAndRegisterBombii = async () => {
        clearError();
        const bombiiTeam = GameLogicUtils.confirmBombii(teamData);

        const isConfirmed = confirm(
            `以下の内容でボンビーを登録しますか？\n` +
                `チーム: ${bombiiTeam.teamName}\n` +
                `総資産: ${bombiiTeam.scoredPoints}\n` +
                `目的駅までの距離: ${bombiiTeam.remainingStationsNumber}駅`
        );
        if (!isConfirmed) {
            return;
        }

        try {
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
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            notifyToDiscord(bombiiTeam.teamName);
            alert("ボンビーの登録が完了しました。");
        } catch (error) {
            console.error("Error registering bombii:", error);
            alert("ボンビーの登録に失敗しました。");
            return;
        }
    };

    return (
        <>
            <Box>
                <FormTitle title="ボンビー自動設定" />
                <FormDescription>現時点でのボンビーをチェックし、自動で設定する。</FormDescription>
                <Box
                    border={1}
                    borderRadius={1}
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        margin: 2,
                        padding: 2,
                        backgroundColor: "white",
                    }}
                >
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <CustomButton onClick={confirmAndRegisterBombii}>送信</CustomButton>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default RegisterBombiiAutoForm;
