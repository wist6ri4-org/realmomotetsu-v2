/**
 * 現在地登録フォーム
 */
"use client";

import CustomButton from "@/components/base/CustomButton";
import CustomSelect from "@/components/base/CustomSelect";
import { Stations, Teams } from "@/generated/prisma";
import { useSelectInput } from "@/hooks/useSelectInput";
import { TypeConverter } from "@/utils/typeConverter";
import { Box } from "@mui/material";
import React from "react";

/**
 * CurrentLocationFormコンポーネントのプロパティ型定義
 * @property {Teams[]} teams - チームのリスト
 * @property {Stations[]} stations - 駅のリスト
 * @property {Stations[]} [nearByStations] - オプションとして最寄り駅のリスト
 */
interface CurrentLocationFormProps {
    teams: Teams[];
    stations: Stations[];
    closestStations?: Stations[]; // オプションとして最寄り駅を受け取る
}

/**
 * 現在地登録フォームコンポーネント
 * @param teams - チームのリスト
 * @param stations - 駅のリスト
 * @returns {JSX.Element} - CurrentLocationFormコンポーネント
 */
const CurrentLocationForm: React.FC<CurrentLocationFormProps> = ({
    teams,
    stations,
    closestStations: closestStations,
}): React.JSX.Element => {
    const selectedTeamCodeInput = useSelectInput("");
    const selectedStationCodeInput = useSelectInput(
        closestStations?.[0]?.stationCode ? String(closestStations?.[0]?.stationCode) : ""
    );

    /**
     * データの登録
     */
    const createTransitStation = async () => {
        const isConfirmed = confirm(
            "以下の内容で登録しますか？\n" +
                `チーム: ${selectedTeamCodeInput.value}\n` +
                `駅: ${selectedStationCodeInput.value}`
        );
        if (!isConfirmed) {
            return;
        }
        try {
            const response = await fetch("/api/transit-stations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    eventCode: "TOKYU_20250517", // TODO: イベントコードをセッションから取得する
                    teamCode: selectedTeamCodeInput.value,
                    stationCode: selectedStationCodeInput.value,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            selectedTeamCodeInput.reset();
            selectedStationCodeInput.reset();
            alert("登録されました。");
        } catch (error) {
            console.error("Error creating transit station:", error);
            alert("登録に失敗しました。");
            return;
        }
    };

    return (
        <>
            <Box>
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
                            value={selectedTeamCodeInput.value}
                            onChange={selectedTeamCodeInput.handleChange}
                            size="small"
                            variant="outlined"
                            label="チーム名"
                            fullWidth
                        />
                    </Box>
                    <Box sx={{ marginBottom: 2 }}>
                        <CustomSelect
                            options={TypeConverter.convertStationsToSelectOptions(stations)}
                            value={selectedStationCodeInput.value}
                            onChange={selectedStationCodeInput.handleChange}
                            size="small"
                            variant="outlined"
                            label="今いる駅"
                            fullWidth
                        />
                    </Box>
                    <Box sx={{ marginTop: 5 }}>
                        <CustomButton fullWidth onClick={createTransitStation}>
                            送信
                        </CustomButton>
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default CurrentLocationForm;
