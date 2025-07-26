/**
 * 目的駅到着処理フォーム
 */
"use client";

import CustomButton from "@/components/base/CustomButton";
import CustomNumberInput from "@/components/base/CustomNumberInput";
import CustomSelect from "@/components/base/CustomSelect";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { Teams } from "@/generated/prisma";
import { useNumberInput } from "@/hooks/useNumberInput";
import { useSelectInput } from "@/hooks/useSelectInput";
import { TypeConverter } from "@/utils/typeConverter";
import { Box } from "@mui/material";
import { useParams } from "next/navigation";
import React from "react";

/**
 * ArrivalGoalStationsFormコンポーネントのプロパティ型定義
 * @property {Teams[]} teams - チームのリスト
 */
interface ArrivalGoalStationsFormProps {
    teams: Teams[];
}

/**
 * 目的駅到着処理フォームコンポーネント
 * @param {ArrivalGoalStationsFormProps} props - ArrivalGoalStationsFormのプロパティ
 * @return {JSX.Element} - ArrivalGoalStationsFormコンポーネント
 */
const ArrivalGoalStationsForm: React.FC<ArrivalGoalStationsFormProps> = ({
    teams,
}: ArrivalGoalStationsFormProps): React.JSX.Element => {
    const { eventCode } = useParams();

    const teamCodeInput = useSelectInput("");
    const pointsInput = useNumberInput(0);

    /**
     * データの登録
     */
    const createArrivalData = async () => {
        const isConfirmed = confirm(
            "以下の内容で到着処理を行いますか？\n" +
                `チーム: ${
                    teams.find((team) => team.teamCode === teamCodeInput.value)?.teamName || "不明"
                }\n` +
                `ポイント: ${pointsInput.value || "不明"}`
        );
        if (!isConfirmed) {
            return;
        }

        try {
            const responseCreatePoints = await fetch("/api/points", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventCode: eventCode,
                    teamCode: teamCodeInput.value,
                    points: pointsInput.value,
                    status: "points",
                }),
            });

            if (!responseCreatePoints.ok) {
                throw new Error(`HTTP error! status: ${responseCreatePoints.status}`);
            }

            const responseUpdatePoints = await fetch("/api/points", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    teamCode: teamCodeInput.value,
                }),
            });

            if (!responseUpdatePoints.ok) {
                throw new Error(`HTTP error! status: ${responseUpdatePoints.status}`);
            }

            teamCodeInput.reset();
            pointsInput.reset();
            alert("登録が完了しました。");
        } catch (error) {
            console.error("Error registering:", error);
            alert("登録に失敗しました。");
            return;
        }
    };

    return (
        <>
            <Box>
                <FormTitle title="目的駅到着処理" />
                <FormDescription>
                    目的駅に到着した場合、チームを選択し、到着処理を行なう。
                    <br />
                    到着ポイントは、前の目的駅から今回の目的駅までの運賃を入力する。
                    <br />
                    換金も同時に実行される。
                </FormDescription>
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
                    <Box sx={{ marginBottom: 2 }}>
                        <CustomNumberInput
                            value={pointsInput.value}
                            label="到着ポイント"
                            showSteppers={true}
                            step={5}
                            onChange={pointsInput.handleChange}
                        />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <CustomButton onClick={createArrivalData}>送信</CustomButton>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default ArrivalGoalStationsForm;
