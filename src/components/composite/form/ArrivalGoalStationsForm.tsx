/**
 * 目的駅到着処理フォーム
 */
"use client";

import AlertDialog from "@/components/base/AlertDialog";
import ConfirmDialog from "@/components/base/ConfirmDialog";
import CustomButton from "@/components/base/CustomButton";
import CustomNumberInput from "@/components/base/CustomNumberInput";
import CustomSelect from "@/components/base/CustomSelect";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { DialogConstants } from "@/constants/dialogConstants";
import { Teams } from "@/generated/prisma";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useNumberInput } from "@/hooks/useNumberInput";
import { useSelectInput } from "@/hooks/useSelectInput";
import { TypeConverter } from "@/utils/typeConverter";
import { Box, CircularProgress } from "@mui/material";
import { useParams } from "next/navigation";
import React, { useState } from "react";

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

    const { isConfirmOpen, dialogOptions, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();
    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * データの登録
     * @param {React.FormEvent<HTMLFormElement>} e - フォームの送信イベント
     * @return {Promise<void>} - 登録処理の完了を示すPromise
     */
    const registerArrivalData = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        const confirmMessage =
            "以下の内容で到着処理を行いますか？\n" +
            `チーム: ${teams.find((team) => team.teamCode === teamCodeInput.value)?.teamName || "不明"}\n` +
            `ポイント: ${pointsInput.value}`;
        const isConfirmed = await showConfirmDialog({
            message: confirmMessage,
        });

        if (!isConfirmed) {
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            if (pointsInput.value <= 0) {
                throw new Error("到着ポイントは0以上の値で入力してください。");
            }

            // 到着ポイントの登録
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

            // 既存のポイントステータスをscoredに更新
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

            await showAlertDialog({
                title: DialogConstants.DIALOG_TITLE_REGISTERED,
                message: "目的駅到着処理が完了しました。",
            });
            return;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            await showAlertDialog({
                title: DialogConstants.DIALOG_TITLE_ERROR,
                message: `"目的駅到着処理に失敗しました。\n${error}`,
            });
            return;
        } finally {
            setIsLoading(false);
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
                    component="form"
                    border={1}
                    borderRadius={1}
                    onSubmit={registerArrivalData}
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
                        <CustomNumberInput
                            value={pointsInput.value}
                            label="到着ポイント"
                            showSteppers={true}
                            step={5}
                            onChange={pointsInput.handleChange}
                            disabled={isLoading}
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

export default ArrivalGoalStationsForm;
