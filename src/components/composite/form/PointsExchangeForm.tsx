/**
 * ポイント換金フォーム
 */
"use client";

import CustomButton from "@/components/base/CustomButton";
import CustomSelect from "@/components/base/CustomSelect";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { Teams } from "@/generated/prisma";
import { useSelectInput } from "@/hooks/useSelectInput";
import { TypeConverter } from "@/utils/typeConverter";
import { Box } from "@mui/material";
import React from "react";

interface PointsExchangeFormProps {
    teams: Teams[];
}

const PointsExchangeForm: React.FC<PointsExchangeFormProps> = ({ teams }) => {
    const teamCodeInput = useSelectInput("");

    const updatePointStatus = async () => {
        const isConfirmed = confirm(
            "以下の内容でポイントを換金しますか？\n" +
                `チーム: ${
                    teams.find((team) => team.teamCode === teamCodeInput.value)?.teamName || "不明"
                }`
        );
        if (!isConfirmed) {
            return;
        }

        try {
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
            alert("ポイントの換金が完了しました。");
        } catch (error) {
            console.error("Error exchanging points:", error);
            alert("ポイントの換金に失敗しました。");
            return;
        }
    };

    return (
        <>
            <Box>
                <FormTitle title="ポイント換金" />
                <FormDescription>チームを選択し、ポイントを総資産化する。</FormDescription>
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
                            options={TypeConverter.convertTeamsToSelectOptions(teams)}
                            label="チーム"
                            value={teamCodeInput.value}
                            onChange={teamCodeInput.handleChange}
                            size="small"
                            variant="outlined"
                            sx={{ minWidth: 200 }}
                        />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <CustomButton onClick={updatePointStatus}>送信</CustomButton>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default PointsExchangeForm;
