/**
 * 目的駅登録フォーム
 */
"use client";

import CustomButton from "@/components/base/CustomButton";
import CustomSelect from "@/components/base/CustomSelect";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { Stations } from "@/generated/prisma";
import { useSelectInput } from "@/hooks/useSelectInput";
import { TypeConverter } from "@/utils/typeConverter";
import { Box } from "@mui/material";
import { useParams } from "next/navigation";
import React from "react";

/**
 * RegisterGoalStationsFormコンポーネントのプロパティ型定義
 * @property {Stations[]} stations - 駅のリスト
 */
interface RegisterGoalStationsFormProps {
    stations: Stations[];
}

/**
 * 目的駅登録フォームコンポーネント
 * @param {RegisterGoalStationsFormProps} props - RegisterGoalStationsFormのプロパティ
 * @returns {JSX.Element} - RegisterGoalStationsFormコンポーネント
 */
const RegisterGoalStationsForm: React.FC<RegisterGoalStationsFormProps> = ({
    stations,
}: RegisterGoalStationsFormProps): React.JSX.Element => {
    const { eventCode } = useParams();

    const stationCodeInput = useSelectInput("");

    /**
     * データの登録
     */
    const createGoalStation = async () => {
        const isConfirmed = confirm(
            "以下の内容で登録しますか？\n" +
                `駅: ${
                    stations.find((station) => station.stationCode === stationCodeInput.value)
                        ?.name || "不明"
                }`
        );
        if (!isConfirmed) {
            return;
        }

        try {
            const response = await fetch("/api/goal-stations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventCode: eventCode,
                    stationCode: stationCodeInput.value,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            stationCodeInput.reset();
            alert("登録が完了しました。");
        } catch (error) {
            console.error("Error registering goal station:", error);
            alert("登録に失敗しました。");
            return;
        }
    };

    return (
        <>
            <Box>
                <FormTitle title="目的駅登録" />
                <FormDescription>次の目的駅を登録する。</FormDescription>
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
                            options={TypeConverter.convertStationsToSelectOptions(stations)}
                            label="目的駅"
                            value={stationCodeInput.value}
                            onChange={stationCodeInput.handleChange}
                            size="small"
                            variant="outlined"
                            sx={{ minWidth: 200 }}
                        />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <CustomButton onClick={createGoalStation}>送信</CustomButton>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default RegisterGoalStationsForm;
