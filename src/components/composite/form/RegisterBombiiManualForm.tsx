/**
 * ボンビー手動設定フォーム
 */
"use client";

import CustomButton from "@/components/base/CustomButton";
import CustomSelect from "@/components/base/CustomSelect";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { DiscordNotificationTemplates } from "@/constants/discordNotificationTemplates";
import { Teams } from "@/generated/prisma";
import { useDiscordNotification } from "@/hooks/useDiscordNotification";
import { useSelectInput } from "@/hooks/useSelectInput";
import { TypeConverter } from "@/utils/typeConverter";
import { Box } from "@mui/material";
import { useParams } from "next/navigation";
import React from "react";

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
                teamName:
                    teams.find((team) => team.teamCode === teamCodeInput.value)?.teamName || "不明",
            },
        });
    };

    /**
     * データの登録
     */
    const registerBombiiData = async () => {
        clearError();
        const isConfirmed = confirm(
            "以下の内容でボンビーを登録しますか？\n" +
                `チーム: ${
                    teams.find((team) => team.teamCode === teamCodeInput.value)?.teamName || "不明"
                }`
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
                    teamCode: teamCodeInput.value,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            teamCodeInput.reset();
            notifyToDiscord();
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
                <FormTitle title="ボンビー手動設定" />
                <FormDescription>ボンビー対象のチームを手動で選択し、設定する。</FormDescription>
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
                    <Box sx={{ marginBottom: 2 }}>
                        <CustomSelect
                            options={TypeConverter.convertTeamsToSelectOptions(teams)}
                            label="チーム"
                            value={teamCodeInput.value}
                            onChange={teamCodeInput.handleChange}
                            size="small"
                            variant="outlined"
                            sx={{ minWidth: 200 }}
                        />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <CustomButton onClick={registerBombiiData}>送信</CustomButton>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default RegisterBombiiManualForm;
