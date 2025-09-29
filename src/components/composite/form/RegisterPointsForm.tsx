/**
 * ポイント登録フォーム
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
import PointExchangerDisplay from "@/components/base/PointExchangerDisplay";
import { DialogConstants } from "@/constants/dialogConstants";
import { GameConstants } from "@/constants/gameConstants";
import { getMessage } from "@/constants/messages";
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ApplicationErrorHandler } from "@/error/errorHandler";
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
 * RegisterPointsFormコンポーネントのプロパティ型定義
 * @property {Teams[]} teams - チームのリスト
 * @property {() => void} [onSubmit] - フォーム送信後のコールバック関数
 * @property {boolean} isOperating - 操作権限があるかどうか
 */
interface RegisterPointsFormProps {
    teams: Teams[];
    onSubmit?: () => void;
    isOperating: boolean;
}

// ポイント状態のオプション
const pointStatusOptions: RadioOption[] = [
    { value: GameConstants.POINT_STATUS.POINTS, label: "ポイント" },
    { value: GameConstants.POINT_STATUS.SCORED, label: "総資産" },
];

/**
 * ポイント登録フォームコンポーネント
 * @param {RegisterPointsFormProps} props - RegisterPointsFormのプロパティ
 * @returns {JSX.Element} - RegisterPointsFormコンポーネント
 */
const RegisterPointsForm: React.FC<RegisterPointsFormProps> = ({
    teams,
    onSubmit,
    isOperating,
}: RegisterPointsFormProps): React.JSX.Element => {
    const { eventCode } = useParams();

    const teamCodeInput = useSelectInput("");
    const pointsInput = useNumberInput(0);
    const [pointStatus, setPointStatus] = useState<PointStatus>(GameConstants.POINT_STATUS.POINTS);

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
     *  @return {Promise<void>} - 登録処理の完了を示すPromise
     */
    const registerPointsData = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        const confirmMessage =
            "以下の内容でポイントを登録しますか？\n" +
            `チーム: ${teams.find((team) => team.teamCode === teamCodeInput.value)?.teamName || "不明"}\n` +
            `ポイント: ${pointsInput.value}\n` +
            `ステータス: ${pointStatus === GameConstants.POINT_STATUS.POINTS ? "ポイント" : "総資産"}`;
        const isConfirmed = await showConfirmDialog({
            message: confirmMessage,
        });

        if (!isConfirmed) {
            return;
        }

        try {
            setIsLoading(true);

            // ポイントの登録
            const response = await fetch("/api/points", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventCode: eventCode,
                    teamCode: teamCodeInput.value,
                    points: pointsInput.value,
                    status: pointStatus,
                }),
            });

            if (!response.ok) {
                throw ApplicationErrorFactory.createFromResponse(response);
            }

            teamCodeInput.reset();
            pointsInput.reset();
            setPointStatus(GameConstants.POINT_STATUS.POINTS);

            await showAlertDialog({
                title: DialogConstants.TITLE.REGISTERED,
                message: getMessage("REGISTER_SUCCESS", { data: "ポイント" }),
            });

            onSubmit?.();

            return;
        } catch (err) {
            const appError = ApplicationErrorFactory.normalize(err);
            ApplicationErrorHandler.logError(appError);

            await showAlertDialog({
                title: DialogConstants.TITLE.ERROR,
                message: `${getMessage("REGISTER_FAILED", { data: "ポイント" })}\n${appError.message}`,
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
        pointsInput.reset();
        setIsLoading(false);
    };

    return (
        <>
            <Box>
                <FormTitle title="ポイント登録" />
                <FormDescription>
                    チームを選択し、ポイントを登録する。
                    <br />
                    ポイントまたは総資産として登録することができる。
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
                            label="ポイント"
                            showSteppers={true}
                            step={5}
                            disabled={isLoading}
                            onChange={pointsInput.handleChange}
                        />
                        {pointStatus === GameConstants.POINT_STATUS.SCORED && (
                            <PointExchangerDisplay points={pointsInput.value} />
                        )}
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

export default RegisterPointsForm;
