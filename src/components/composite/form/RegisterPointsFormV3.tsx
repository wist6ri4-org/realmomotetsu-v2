/**
 * ポイント登録フォーム（V3）
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
import { getMessage } from "@/constants/messages";
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ApplicationErrorHandler } from "@/error/errorHandler";
import { PostPointsRequest } from "@/features/points/types";
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
 * RegisterPointsFormV3コンポーネントのプロパティ型定義
 * @property {Teams[]} teams - チームのリスト
 * @property {() => void} [onSubmit] - フォーム送信後のコールバック関数
 * @property {boolean} isOperating - 操作権限があるかどうか
 */
interface RegisterPointsFormV3Props {
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
 * ポイント登録フォームコンポーネント
 * @param {RegisterPointsFormV3Props} props - RegisterPointsFormV3のプロパティ
 * @returns {JSX.Element} - RegisterPointsFormV3コンポーネント
 */
const RegisterPointsFormV3: React.FC<RegisterPointsFormV3Props> = ({
    teams,
    onSubmit,
    isOperating,
}: RegisterPointsFormV3Props): React.JSX.Element => {
    const params = useParams();
    const eventCode = typeof params.eventCode === "string" ? params.eventCode : "";

    const teamCodeInput = useSelectInput("");
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
     *  @return {Promise<void>} - 登録処理の完了を示すPromise
     */
    const registerPointsData = async (e: React.SubmitEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        const confirmMessage =
            "以下の内容でポイントを登録しますか？\n\n" +
            `チーム: ${teams.find((team) => team.teamCode === teamCodeInput.value)?.teamName || "不明"}\n` +
            `ポイント: ${pointsInput.value}\n` +
            `ステータス: ${pointStatus === GameConstants.POINT_STATUS.SCORED
                ? "総資産" : pointStatus === GameConstants.POINT_STATUS.PROPERTY
                ? "物件" : "収益"}`;
        const isConfirmed = await showConfirmDialog({
            message: confirmMessage,
            confirmButtonColor: "primary"
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
                } satisfies PostPointsRequest),
            });

            if (!response.ok) {
                throw ApplicationErrorFactory.createFromResponse(response);
            }

            teamCodeInput.reset();
            pointsInput.reset();
            setPointStatus(GameConstants.POINT_STATUS.SCORED);

            await showAlertDialog({
                title: DialogConstants.TITLE.REGISTERED,
                message: getMessage("REGISTER_SUCCESS", { data: "ポイント" }),
                buttonColor: "primary",
            });

            onSubmit?.();

            return;
        } catch (err) {
            const appError = ApplicationErrorFactory.normalize(err);
            ApplicationErrorHandler.logError(appError);

            await showAlertDialog({
                title: DialogConstants.TITLE.ERROR,
                message: `${getMessage("REGISTER_FAILED", { data: "ポイント" })}\n${appError.message}`,
                buttonColor: "error"
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
                    総資産、物件購入分、収益として登録することができる。
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
                            label="ポイント（単位：万円）"
                            showSteppers={true}
                            step={100}
                            disabled={isLoading}
                            onChange={pointsInput.handleChange}
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

export default RegisterPointsFormV3;
