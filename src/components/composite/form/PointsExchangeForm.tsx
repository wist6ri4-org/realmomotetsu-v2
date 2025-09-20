/**
 * ポイント換金フォーム
 */
"use client";

import AlertDialog from "@/components/base/AlertDialog";
import ConfirmDialog from "@/components/base/ConfirmDialog";
import CustomButton from "@/components/base/CustomButton";
import CustomSelect from "@/components/base/CustomSelect";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { DialogConstants } from "@/constants/dialogConstants";
import { Teams } from "@/generated/prisma";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import { useSelectInput } from "@/hooks/useSelectInput";
import { TypeConverter } from "@/utils/typeConverter";
import { Box, CircularProgress } from "@mui/material";
import React, { useState } from "react";

/**
 * PointsExchangeFormコンポーネントのプロパティ型定義
 * @property {Teams[]} teams - チームのリスト
 * @property {() => void} [onSubmit] - フォーム送信後のコールバック関数
 */
interface PointsExchangeFormProps {
    teams: Teams[];
    onSubmit?: () => void;
}

/**
 * ポイント換金フォームコンポーネント
 * @param {PointsExchangeFormProps} props - PointsExchangeFormのプロパティ
 * @returns {JSX.Element} - PointsExchangeFormコンポーネント
 */
const PointsExchangeForm: React.FC<PointsExchangeFormProps> = ({
    teams,
    onSubmit,
}: PointsExchangeFormProps): React.JSX.Element => {
    const teamCodeInput = useSelectInput("");

    const { isConfirmOpen, dialogOptions, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();
    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * データの更新
     */
    const updatePointStatus = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const confirmMessage =
            "以下の内容でポイントを換金しますか？\n" +
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

            // ポイントステータスをscoredに更新
            const response = await fetch("/api/points", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    teamCode: teamCodeInput.value,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            teamCodeInput.reset();

            await showAlertDialog({
                title: DialogConstants.DIALOG_TITLE_UPDATED,
                message: "ポイントの換金が完了しました。",
            });

            onSubmit?.();

            return;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Unknown error");
            await showAlertDialog({
                title: DialogConstants.DIALOG_TITLE_ERROR,
                message: `ポイントの換金に失敗しました。\n${error}`,
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
        setIsLoading(false);
        setError(null);
    };

    return (
        <>
            <Box>
                <FormTitle title="ポイント換金" />
                <FormDescription>チームを選択し、ポイントを総資産化する。</FormDescription>
                <Box
                    component="form"
                    border={1}
                    borderRadius={1}
                    onSubmit={updatePointStatus}
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
                            disabled={false}
                            sx={{ minWidth: 200 }}
                        />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <CustomButton
                            type="button"
                            variant="outlined"
                            color="secondary"
                            onClick={resetForm}
                            disabled={isLoading}
                            sx={{ marginRight: 1 }}
                        >
                            リセット
                        </CustomButton>
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

export default PointsExchangeForm;
