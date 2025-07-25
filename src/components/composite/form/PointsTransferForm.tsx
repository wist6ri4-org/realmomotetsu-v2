/**
 * ポイント移動フォーム
 */
"use client";

import CustomButton from "@/components/base/CustomButton";
import CustomNumberInput from "@/components/base/CustomNumberInput";
import CustomRadio, { RadioOption } from "@/components/base/CustomRadio";
import CustomSelect from "@/components/base/CustomSelect";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { GameConstants } from "@/constants/gameConstants";
import { PointStatus, Teams } from "@/generated/prisma";
import { useNumberInput } from "@/hooks/useNumberInput";
import { useSelectInput } from "@/hooks/useSelectInput";
import { TypeConverter } from "@/utils/typeConverter";
import { Box } from "@mui/material";
import { useParams } from "next/navigation";
import React, { useState } from "react";

/**
 * PointsTransferFormコンポーネントのプロパティ型定義
 * @property {Teams[]} teams - チームのリスト
 */
interface PointsTransferFormProps {
    teams: Teams[];
}

// ポイント状態のオプション
const pointStatusOptions: RadioOption[] = [
    { value: GameConstants.POINT_STATUS.POINTS, label: "ポイント" },
    { value: GameConstants.POINT_STATUS.SCORED, label: "総資産" },
];

/**
 * ポイント移動フォームコンポーネント
 * @param teams - チームのリスト
 * @returns {JSX.Element} - PointsTransferFormコンポーネント
 */
const PointsTransferForm: React.FC<PointsTransferFormProps> = ({ teams }): React.JSX.Element => {
    const { eventCode } = useParams();

    const fromTeamCodeInput = useSelectInput("");
    const toTeamCodeInput = useSelectInput("");
    const pointsInput = useNumberInput(0);
    const [pointStatus, setPointStatus] = useState<PointStatus>(GameConstants.POINT_STATUS.POINTS);

    /**
     * ポイント状態の変更ハンドラー
     * @param {React.ChangeEvent<HTMLInputElement> | Event} event - イベントオブジェクト
     */
    const handlePointStatusChange = (
        event:
            | React.ChangeEvent<HTMLInputElement>
            | (Event & { target: { value: unknown; name: string } })
    ) => {
        const newValue = event.target.value as PointStatus;
        setPointStatus(newValue);
        console.log("選択されたポイント状態:", newValue);
    };

    /**
     * データの登録
     */
    const createPointsData = async () => {
        const isConfirmed = confirm(
            "以下の内容でポイントを移動しますか？\n" +
                `移動元チーム: ${
                    teams.find((team) => team.teamCode === fromTeamCodeInput.value)?.teamName ||
                    "不明"
                }\n` +
                `移動先チーム: ${
                    teams.find((team) => team.teamCode === toTeamCodeInput.value)?.teamName ||
                    "不明"
                }\n` +
                `ポイント: ${pointsInput.value || "不明"}\n` +
                `状態: ${pointStatus}`
        );
        if (!isConfirmed) {
            return;
        }

        try {
            const responseFrom = await fetch("/api/points", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventCode: eventCode,
                    teamCode: fromTeamCodeInput.value,
                    points: 0 - pointsInput.value,
                    status: pointStatus,
                }),
            });

            if (!responseFrom.ok) {
                throw new Error(`HTTP error! status: ${responseFrom.status}`);
            }

            const responseTo = await fetch("/api/points", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventCode: eventCode,
                    teamCode: toTeamCodeInput.value,
                    points: pointsInput.value,
                    status: pointStatus,
                }),
            });

            if (!responseTo.ok) {
                throw new Error(`HTTP error! status: ${responseTo.status}`);
            }
            fromTeamCodeInput.reset();
            toTeamCodeInput.reset();
            pointsInput.reset();
            setPointStatus(GameConstants.POINT_STATUS.POINTS);
            alert("ポイントの移動が完了しました。");
        } catch (error) {
            console.error("ポイントの移動に失敗しました:", error);
            alert("ポイントの移動に失敗しました。");
            return;
        }
    };

    return (
        <>
            <Box>
                <FormTitle title="ポイント移動" />
                <FormDescription>
                    ２チームを選択し、移動元から移動先へポイントを移動する。
                    <br />
                    ポイントまたは総資産として移動することができる。
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
                            label="移動元チーム"
                            value={fromTeamCodeInput.value}
                            onChange={fromTeamCodeInput.handleChange}
                            size="small"
                            variant="outlined"
                            sx={{ minWidth: 200 }}
                        />
                    </Box>
                    <Box sx={{ marginBottom: 2 }}>
                        <CustomSelect
                            options={TypeConverter.convertTeamsToSelectOptions(teams)}
                            label="移動先チーム"
                            value={toTeamCodeInput.value}
                            onChange={toTeamCodeInput.handleChange}
                            size="small"
                            variant="outlined"
                            sx={{ minWidth: 200 }}
                        />
                    </Box>
                    <Box sx={{ marginBottom: 2 }}>
                        <CustomNumberInput
                            value={pointsInput.value}
                            label="ポイント"
                            showSteppers={true}
                            step={5}
                            min={0}
                            onChange={pointsInput.handleChange}
                        />
                    </Box>
                    <Box sx={{ marginBottom: 2 }}>
                        <CustomRadio
                            options={pointStatusOptions}
                            value={pointStatus}
                            onChange={handlePointStatusChange}
                            size="small"
                            label="ステータス"
                            row={true}
                        />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <CustomButton onClick={createPointsData}>送信</CustomButton>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default PointsTransferForm;
