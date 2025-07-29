/**
 * 洗足池ミッション得点計算フォーム
 */
"use client";

import CustomButton from "@/components/base/CustomButton";
import CustomNumberInput from "@/components/base/CustomNumberInput";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { useNumberInput } from "@/hooks/useNumberInput";
import { MissionToolUtils } from "@/utils/missionToolUtils";
import { Box, Typography } from "@mui/material";
import React from "react";

/**
 * 洗足池ミッション得点計算フォームコンポーネント
 * @returns {JSX.Element} - MissionFormSenzokuikeコンポーネ
 */
const MissionFormSenzokuike: React.FC = () => {
    const answerInput = useNumberInput(MissionToolUtils.MissionSenzokuike.SENZOKUIKE_AREA);

    /**
     * 洗足池ミッションの得点を計算する
     */
    const calculatePoints = () => {
        const points = MissionToolUtils.MissionSenzokuike.calculate(answerInput.value);

        alert(`洗足池ミッションの得点は ${points} 点です。`);
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
                    <CustomButton onClick={calculatePoints}>送信</CustomButton>
                </Box>
            </Box>
        </>
    );
};

export default MissionFormSenzokuike;
