/**
 * ボンビー自動設定フォーム
 */
"use client";

import CustomButton from "@/components/base/CustomButton";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
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
 * @param teamData - チームデータのリスト
 * @returns {JSX.Element} - RegisterBombiiAutoFormコンポーネント
 */
const RegisterBombiiAutoForm: React.FC<RegisterBombiiAutoFormProps> = ({
    teamData,
}): React.JSX.Element => {
    const { eventCode } = useParams();

    /**
     * データの確認と登録
     */
    const confirmBombii = async () => {
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
                        <CustomButton onClick={confirmBombii}>送信</CustomButton>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default RegisterBombiiAutoForm;
