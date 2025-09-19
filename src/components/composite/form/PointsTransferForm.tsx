/**
 * ポイント移動フォーム
 */
"use client";

import AlertDialog from "@/components/base/AlertDialog";
import ConfirmDialog from "@/components/base/ConfirmDialog";
import CustomButton from "@/components/base/CustomButton";
import CustomNumberInput from "@/components/base/CustomNumberInput";
import CustomRadio, { RadioOption } from "@/components/base/CustomRadio";
import CustomSelect from "@/components/base/CustomSelect";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { DialogConstants } from "@/constants/dialogConstants";
import { GameConstants } from "@/constants/gameConstants";
import { PointStatus, Teams } from "@/generated/prisma";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useNumberInput } from "@/hooks/useNumberInput";
import { useSelectInput } from "@/hooks/useSelectInput";
import { TypeConverter } from "@/utils/typeConverter";
import { Box, CircularProgress } from "@mui/material";
import { useParams } from "next/navigation";
import React, { useState } from "react";

/**
 * PointsTransferFormコンポーネントのプロパティ型定義
 * @property {Teams[]} teams - チームのリスト
 * @property {() => void} [onSubmit] - フォーム送信後のコールバック関数
 */
interface PointsTransferFormProps {
    teams: Teams[];
    onSubmit?: () => void;
}

// ポイント状態のオプション
const pointStatusOptions: RadioOption[] = [
    { value: GameConstants.POINT_STATUS.POINTS, label: "ポイント" },
    { value: GameConstants.POINT_STATUS.SCORED, label: "総資産" },
];

/**
 * ポイント移動フォームコンポーネント
 * @param {PointsTransferFormProps} props - PointsTransferFormのプロパティ
 * @returns {JSX.Element} - PointsTransferFormコンポーネント
 */
const PointsTransferForm: React.FC<PointsTransferFormProps> = ({
    teams,
    onSubmit,
}: PointsTransferFormProps): React.JSX.Element => {
    const { eventCode } = useParams();

    const fromTeamCodeInput = useSelectInput("");
    const toTeamCodeInput = useSelectInput("");
    const pointsInput = useNumberInput(0);
    const [pointStatus, setPointStatus] = useState<PointStatus>(GameConstants.POINT_STATUS.POINTS);

    const { isConfirmOpen, dialogOptions, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();
    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * ポイント状態の変更ハンドラー
     * @param {React.ChangeEvent<HTMLInputElement> | Event} event - イベントオブジェクト
     */
    const handlePointStatusChange = (
        event: React.ChangeEvent<HTMLInputElement> | (Event & { target: { value: unknown; name: string } })
    ) => {
        const newValue = event.target.value as PointStatus;
        setPointStatus(newValue);
    };

    /**
     * データの登録
     * @param {React.FormEvent<HTMLFormElement>} e - フォームの送信イベント
     * @return {Promise<void>} - 登録処理の完了を示すPromise
     */
    const registerPointsData = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        const confirmMessage =
            "以下の内容でポイントを移動しますか？\n" +
            `移動元チーム: ${teams.find((team) => team.teamCode === fromTeamCodeInput.value)?.teamName || "不明"}\n` +
            `移動先チーム: ${teams.find((team) => team.teamCode === toTeamCodeInput.value)?.teamName || "不明"}\n` +
            `ポイント: ${pointsInput.value}\n` +
            `ステータス: ${pointStatus}`;
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
                throw new Error("移動ポイントは0より大きい値で入力してください。");
            }

            if (fromTeamCodeInput.value === toTeamCodeInput.value) {
                throw new Error("移動元と移動先のチームは異なるチームでなければなりません。");
            }

            const [responseOfFrom, responseOfTo] = await Promise.all([
                fetch("/api/points", {
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
                }),
                fetch("/api/points", {
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
                }),
            ]);

            if (!responseOfFrom.ok) {
                throw new Error(`HTTP error! status: ${responseOfFrom.status}`);
            }

            if (!responseOfTo.ok) {
                throw new Error(`HTTP error! status: ${responseOfTo.status}`);
            }

            fromTeamCodeInput.reset();
            toTeamCodeInput.reset();
            pointsInput.reset();
            setPointStatus(GameConstants.POINT_STATUS.POINTS);

            await showAlertDialog({
                title: DialogConstants.DIALOG_TITLE_UPDATED,
                message: "ポイントの移動が完了しました。",
            });

            onSubmit?.();

            return;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            await showAlertDialog({
                title: DialogConstants.DIALOG_TITLE_ERROR,
                message: `ポイントの移動に失敗しました。\n${error}`,
            });
            return;
        } finally {
            setIsLoading(false);
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
                    component="form"
                    border={1}
                    borderRadius={1}
                    onSubmit={registerPointsData}
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
                            required
                            disabled={isLoading}
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
                            required
                            disabled={isLoading}
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
                            disabled={isLoading}
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

export default PointsTransferForm;
