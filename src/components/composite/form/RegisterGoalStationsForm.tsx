/**
 * 目的駅登録フォーム
 */
"use client";

import CustomButton from "@/components/base/CustomButton";
import CustomSelect from "@/components/base/CustomSelect";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { Stations } from "@/generated/prisma";
import { TypeConverter } from "@/utils/typeConverter";
import { Box } from "@mui/material";
import React, { useState } from "react";

interface RegisterGoalStationsFormProps {
    stations: Stations[];
}

const RegisterGoalStationsForm: React.FC<RegisterGoalStationsFormProps> = ({
    stations,
}): React.JSX.Element => {
    const [selectedStationCode, setSelectedStationCode] = useState<string>("");

    const handleSelectStationCodeChange = (
        event:
            | React.ChangeEvent<HTMLInputElement>
            | (Event & { target: { value: unknown; name: string } })
    ) => {
        const newValue = event.target.value as string;
        setSelectedStationCode(newValue);
        console.log("選択された駅:", newValue);
    };

    const createGoalStation = async () => {
        const isConfirmed = confirm(
            "以下の内容で登録しますか？\n" +
                `駅: ${
                    stations.find((station) => station.stationCode === selectedStationCode)?.name ||
                    "不明"
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
                    eventCode: "TOKYU_20250517", // TODO: イベントコードをセッションから取得する
                    stationCode: selectedStationCode,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            setSelectedStationCode("");
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
                            value={selectedStationCode}
                            onChange={handleSelectStationCodeChange}
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
