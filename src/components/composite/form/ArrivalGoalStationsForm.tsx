/**
 * 目的駅到着処理フォーム
 */
"use client";

import CustomButton from "@/components/base/CustomButton";
import CustomNumberInput from "@/components/base/CustomNumberInput";
import CustomSelect from "@/components/base/CustomSelect";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { Teams } from "@/generated/prisma";
import { TypeConverter } from "@/utils/typeConverter";
import { Box } from "@mui/material";
import React, { useRef, useState } from "react";

interface ArrivalGoalStationsFormProps {
    teams: Teams[];
}

const ArrivalGoalStationsForm: React.FC<ArrivalGoalStationsFormProps> = ({
    teams,
}): React.JSX.Element => {
    const [selectedTeamCode, setSelectedTeamCode] = useState<string>("");
    const points = useRef<HTMLInputElement | null>(null);

    const handleSelectedTeamCodeChange = (
        event:
            | React.ChangeEvent<HTMLInputElement>
            | (Event & { target: { value: unknown; name: string } })
    ) => {
        const newValue = event.target.value as string;
        setSelectedTeamCode(newValue);
        console.log("選択されたチーム:", newValue);
    };

    const createArrivalData = async () => {
        const isConfirmed = confirm(
            "以下の内容で到着処理を行いますか？\n" +
                `チーム: ${
                    teams.find((team) => team.teamCode === selectedTeamCode)?.teamName || "不明"
                }\n` +
                `ポイント: ${points.current?.value || "不明"}`
        );
        if (!isConfirmed) {
            return;
        }

        try {
            const responseCreatePoints = await fetch("/api/points", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventCode: "TOKYU_20250517", // TODO: イベントコードをセッションから取得する
                    teamCode: selectedTeamCode,
                    points: Number(points.current?.value),
                    status: "points",
                }),
            });

            if(!responseCreatePoints.ok) {
                throw new Error(`HTTP error! status: ${responseCreatePoints.status}`);
            }

            const responseUpdatePoints = await fetch("/api/points", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    teamCode: selectedTeamCode,
                }),
            })

            if (!responseUpdatePoints.ok) {
                throw new Error(`HTTP error! status: ${responseUpdatePoints.status}`);
            }

            const data = await responseUpdatePoints.json();
            console.log("到着処理成功:", data);
            setSelectedTeamCode("");
            if (points.current) {
                points.current.value = "";
            }
            alert("登録が完了しました。");
        } catch (error) {
            console.error("Error registering:", error);
            alert("登録に失敗しました。");
            return;
        }
    };

    return (
        <>
            <Box>
                <FormTitle title="目的駅到着処理" />
                <FormDescription>
                    目的駅に到着した場合、チームを選択し、到着処理を行なう。
                    <br />
                    到着ポイントは、前の目的駅から今回の目的駅までの運賃を入力する。
                    <br />
                    換金も同時に実行される。
                </FormDescription>
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
                            value={selectedTeamCode}
                            onChange={handleSelectedTeamCodeChange}
                            size="small"
                            variant="outlined"
                            sx={{ minWidth: 200 }}
                        />
                    </Box>
                    <Box sx={{ marginBottom: 2 }}>
                        <CustomNumberInput
                            ref={points}
                            label="到着ポイント"
                            showSteppers={true}
                            step={5}
                        />
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <CustomButton onClick={createArrivalData}>送信</CustomButton>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default ArrivalGoalStationsForm;
