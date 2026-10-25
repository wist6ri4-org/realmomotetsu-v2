/**
 * 竹橋ミッション得点計算フォーム
 */
"use client";

import AlertDialog from "@/components/base/AlertDialog";
import CustomButton from "@/components/base/CustomButton";
import CustomNumberInput from "@/components/base/CustomNumberInput";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useNumberInput } from "@/hooks/useNumberInput";
import { Converter } from "@/utils/converter";
import { MissionToolUtils } from "@/utils/missionToolUtils";
import { Box, Typography } from "@mui/material";
import React, { useState } from "react";

/**
 * 竹橋ミッション得点計算フォームコンポーネント
 * @returns {JSX.Element} - MissionFormTakebashiコンポーネ
 */
const MissionFormTakebashi: React.FC = (): React.JSX.Element => {
    const answerInput = useNumberInput(MissionToolUtils.MissionTakebashi.TAKEBASHI_LENGTH);

    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    /**
     * 竹橋ミッションの得点を計算する
     * @return {Promise<void>} - 計算処理の完了を示すPromise
     */
    const calculatePoints = async (): Promise<void> => {
        setIsLoading(true);

        const points = MissionToolUtils.MissionTakebashi.calculate(answerInput.value);
        const alertMessage = `竹橋ミッションの賞金は ${Converter.convertPointsToYenV3(points)} 円です。`;
        await showAlertDialog({
            title: "計算結果",
            message: alertMessage,
        });

        setIsLoading(false);
    };

    /**
     * フォームをリセットする
     * @return {void}
     */
    const resetForm = (): void => {
        answerInput.setValue(MissionToolUtils.MissionTakebashi.TAKEBASHI_LENGTH);
    };

    return (
        <>
            <FormTitle title="竹橋ミッション得点計算ツール" />
            <FormDescription>竹橋ミッションの得点を計算する。</FormDescription>
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
                <Box sx={{ marginBottom: 2, display: "flex" }}>
                    <CustomNumberInput
                        value={answerInput.value}
                        label="メートル"
                        showSteppers={true}
                        step={0.1}
                        onChange={answerInput.handleChange}
                    />
                    <Typography variant="body1" sx={{ display: "flex", alignItems: "flex-end", marginLeft: 2 }}>
                        ㎡
                    </Typography>
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
                    <CustomButton onClick={calculatePoints} disabled={isLoading} color={"success"}>
                        計算
                    </CustomButton>
                </Box>
            </Box>
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

export default MissionFormTakebashi;
