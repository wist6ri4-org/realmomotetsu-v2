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
import { ErrorCodes } from "@/constants/errorCodes";
import { GameConstants } from "@/constants/gameConstants";
import { getMessage } from "@/constants/messages";
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ApplicationErrorHandler, ValidationErrorHandler } from "@/error/errorHandler";
import { PostBulkPointsRequest } from "@/features/points/bulk/types";
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
 * PointsTransferFormV3コンポーネントのプロパティ型定義
 * @property {Teams[]} teams - チームのリスト
 * @property {() => void} [onSubmit] - フォーム送信後のコールバック関数
 * @property {boolean} isOperating - 操作権限があるかどうか
 */
interface PointsTransferFormV3Props {
    teams: Teams[];
    onSubmit?: () => void;
    isOperating: boolean;
}

// ポイント状態のオプション
const pointStatusOptions: RadioOption[] = [
    { value: GameConstants.POINT_STATUS.SCORED, label: "総資産" },
    { value: GameConstants.POINT_STATUS.PROPERTY, label: "物件" },
    { value: GameConstants.POINT_STATUS.REVENUE, label: "収益" },
];

/**
 * ポイント移動フォームコンポーネント
 * @param {PointsTransferFormV3Props} props - PointsTransferFormV3のプロパティ
 * @returns {JSX.Element} - PointsTransferFormV3コンポーネント
 */
const PointsTransferFormV3: React.FC<PointsTransferFormV3Props> = ({
    teams,
    onSubmit,
    isOperating,
}: PointsTransferFormV3Props): React.JSX.Element => {
    const params = useParams();
    const eventCode = typeof params.eventCode === "string" ? params.eventCode : "";

    const fromTeamCodeInput = useSelectInput("");
    const toTeamCodeInput = useSelectInput("");
    const pointsInput = useNumberInput(0);
    const [pointStatus, setPointStatus] = useState<PointStatus>(GameConstants.POINT_STATUS.SCORED);

    const { isConfirmOpen, dialogOptions, showConfirmDialog, handleConfirm, handleCancel } = useConfirmDialog();
    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    /**
     * ポイント状態の変更ハンドラー
     * @param {React.ChangeEvent<HTMLInputElement> | Event} event - イベントオブジェクト
     */
    const handlePointStatusChange = (
        event: React.ChangeEvent<HTMLInputElement> | (Event & { target: { value: unknown; name: string } })
    ) => {
        const newValue = event.target.value as PointStatus;
        setPointStatus(newValue);
        console.log("選択されたポイント状態:", newValue);
    };

    /**
     * データの登録
     * @param {React.FormEvent<HTMLFormElement>} e - フォームの送信イベント
     * @return {Promise<void>} - 登録処理の完了を示すPromise
     */
    const registerPointsData = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        const confirmMessage =
            "以下の内容でポイントを移動しますか？\n\n" +
            `移動元チーム: ${teams.find((team) => team.teamCode === fromTeamCodeInput.value)?.teamName || "不明"}\n` +
            `移動先チーム: ${teams.find((team) => team.teamCode === toTeamCodeInput.value)?.teamName || "不明"}\n` +
            `ポイント: ${pointsInput.value}\n` +
            `ステータス: ${pointStatus === GameConstants.POINT_STATUS.SCORED
                ? "総資産" : pointStatus === GameConstants.POINT_STATUS.PROPERTY
                    ? "物件" : "収益"}`;
        const isConfirmed = await showConfirmDialog({
            message: confirmMessage,
        });

        if (!isConfirmed) {
            return;
        }

        try {
            setIsLoading(true);

            // バリデーション
            ValidationErrorHandler.validatePositive(pointsInput.value, "ポイント");

            if (fromTeamCodeInput.value === toTeamCodeInput.value) {
                throw ApplicationErrorFactory.create(
                    ErrorCodes.VALIDATION_ERROR,
                    getMessage("SAME_TEAM_ERROR")
                );
            }

            const response = await fetch("/api/points/bulk", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventCode: eventCode,
                    fromTeamCode: fromTeamCodeInput.value,
                    toTeamCode: toTeamCodeInput.value,
                    points: pointsInput.value,
                    status: pointStatus,
                } satisfies PostBulkPointsRequest),
            });

            if (!response.ok) {
                throw ApplicationErrorFactory.createFromResponse(response);
            }

            fromTeamCodeInput.reset();
            toTeamCodeInput.reset();
            pointsInput.reset();
            setPointStatus(GameConstants.POINT_STATUS.SCORED);

            await showAlertDialog({
                title: DialogConstants.TITLE.UPDATED,
                message: getMessage("POINTS_TRANSFER_SUCCESS"),
            });

            onSubmit?.();

            return;
        } catch (err) {
            const appError = ApplicationErrorFactory.normalize(err);
            ApplicationErrorHandler.logError(appError);

            await showAlertDialog({
                title: DialogConstants.TITLE.ERROR,
                message: `${getMessage("POINTS_TRANSFER_FAILED")}\n${appError.message}`,
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
        fromTeamCodeInput.reset();
        toTeamCodeInput.reset();
        pointsInput.reset();
        setIsLoading(false);
    };

    return (
        <>
            <Box>
                <FormTitle title="ポイント移動" />
                <FormDescription>
                    ２チームを選択し、移動元から移動先へポイントを移動する。
                    <br />
                    総資産、物件購入分、収益として移動することができる。
                    <br />
                    物件と収益はトラブル用なので基本総資産でよい。
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
                            label="ポイント（単位：万円）"
                            showSteppers={true}
                            step={100}
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
                            label="ステータス（基本総資産でよい）"
                            row={true}
                        />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <CustomButton
                            type="button"
                            color="light"
                            onClick={resetForm}
                            disabled={isLoading}
                            sx={{ marginRight: 1 }}
                        >
                            リセット
                        </CustomButton>
                        <CustomButton
                            type="submit"
                            disabled={isLoading || !isOperating}
                            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                            {isLoading ? "送信中..." : !isOperating ? "準備中" : "送信"}
                        </CustomButton>
                    </Box>
                </Box>
            </Box>
            <ConfirmDialog
                isConfirmOpen={isConfirmOpen}
                title={dialogOptions.title}
                message={dialogOptions.message}
                confirmButtonColor={dialogOptions.confirmButtonColor}
                cancelButtonColor={dialogOptions.cancelButtonColor}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
            />
            <AlertDialog
                isAlertOpen={isAlertOpen}
                title={alertOptions.title}
                message={alertOptions.message}
                buttonColor={alertOptions.buttonColor}
                onOk={handleAlertOk}
                okText={alertOptions.okText}
            />
        </>
    );
};

export default PointsTransferFormV3;
