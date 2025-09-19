/**
 * 洗足池ミッション得点計算フォーム
 */
"use client";

import AlertDialog from "@/components/base/AlertDialog";
import CustomButton from "@/components/base/CustomButton";
import CustomNumberInput from "@/components/base/CustomNumberInput";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useNumberInput } from "@/hooks/useNumberInput";
import { MissionToolUtils } from "@/utils/missionToolUtils";
import { Box, Typography } from "@mui/material";
import React, { useState } from "react";

/**
 * 洗足池ミッション得点計算フォームコンポーネント
 * @returns {JSX.Element} - MissionFormSenzokuikeコンポーネ
 */
const MissionFormSenzokuike: React.FC = (): React.JSX.Element => {
    const answerInput = useNumberInput(MissionToolUtils.MissionSenzokuike.SENZOKUIKE_AREA);

    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    /**
     * 洗足池ミッションの得点を計算する
     * @return {Promise<void>} - 計算処理の完了を示すPromise
     */
    const calculatePoints = async (): Promise<void> => {
        setIsLoading(true);

        const points = MissionToolUtils.MissionSenzokuike.calculate(answerInput.value);
        const alertMessage = `洗足池ミッションの得点は ${points} 点です。`;
        await showAlertDialog({
            title: "計算結果",
            message: alertMessage,
        });

        setIsLoading(false);
    };

    return (
        <>
            <FormTitle title="洗足池ミッション得点計算ツール" />
            <FormDescription>洗足池ミッションの得点を計算する。</FormDescription>
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
                        label="ポイント"
                        showSteppers={true}
                        step={1000}
                        onChange={answerInput.handleChange}
                    />
                    <Typography variant="body1" sx={{ display: "flex", alignItems: "flex-end", marginLeft: 2 }}>
                        ㎡
                    </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <CustomButton onClick={calculatePoints} disabled={isLoading}>
                        送信
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

export default MissionFormSenzokuike;
