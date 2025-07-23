/**
 * 現在地登録フォーム
 */
"use client";

import CustomButton from "@/components/base/CustomButton";
import CustomSelect from "@/components/base/CustomSelect";
import { Stations, Teams } from "@/generated/prisma";
import { TypeConverter } from "@/utils/typeConverter";
import { Box } from "@mui/material";
import React, { useState } from "react";

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
 * CurrentLocationFormコンポーネント
 * @param teams - チームのリスト
 * @param stations - 駅のリスト
 * @returns {JSX.Element} - CurrentLocationFormコンポーネント
 */
const CurrentLocationForm: React.FC<CurrentLocationFormProps> = ({
    teams,
    stations,
    closestStations: closestStations,
}): React.JSX.Element => {
    const [selectedTeamCode, setSelectedTeamCode] = useState<string>("");
    const [selectedStationCode, setSelectedStationCode] = useState<string>(
        closestStations?.[0]?.stationCode ? String(closestStations?.[0]?.stationCode) : ""
    );

    /**
     * 選択されたチームの変更ハンドラー
     * @param event - イベントオブジェクト
     * @param event.target.value - 新しいチームIDの値
     * @param event.target.name - イベントの名前（オプション）
     */
    const handleSelectedTeamChange = (
        event:
            | React.ChangeEvent<HTMLInputElement>
            | (Event & { target: { value: unknown; name: string } })
    ) => {
        const newValue = event.target.value as string;
        setSelectedTeamCode(newValue);
        console.log("選択されたチーム:", newValue);
    };

    /**
     * 選択された駅の変更ハンドラー
     * @param event - イベントオブジェクト
     * @param event.target.value - 新しい駅IDの値
     * @param event.target.name - イベントの名前（オプション）
     */
    const handleSelectedStationChange = (
        event:
            | React.ChangeEvent<HTMLInputElement>
            | (Event & { target: { value: unknown; name: string } })
    ) => {
        const newValue = event.target.value as string;
        setSelectedStationCode(newValue);
        console.log("選択された駅:", newValue);
    };

    /**
     * 現在地の登録
     */
    const createTransitStation = async () => {
        const isConfirmed = confirm(
            "以下の内容で登録しますか？\n" +
                `チーム: ${selectedTeamCode}\n` +
                `駅: ${selectedStationCode}`
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
                    teamCode: selectedTeamCode,
                    stationCode: selectedStationCode,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            setSelectedTeamCode("");
            setSelectedStationCode("");
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
                <Box sx={{ display: "flex", flexDirection: "column", padding: 2 }}>
                    <Box sx={{ marginBottom: 2 }}>
                        <CustomSelect
                            options={TypeConverter.convertTeamsToSelectOptions(teams)}
                            value={selectedTeamCode}
                            onChange={handleSelectedTeamChange}
                            size="small"
                            variant="outlined"
                            label="チーム名"
                            fullWidth
                            sx={{ backgroundColor: "white" }}
                        />
                    </Box>
                    <Box sx={{ marginBottom: 2 }}>
                        <CustomSelect
                            options={TypeConverter.convertStationsToSelectOptions(stations)}
                            value={selectedStationCode}
                            onChange={handleSelectedStationChange}
                            size="small"
                            variant="outlined"
                            label="今いる駅"
                            fullWidth
                            sx={{ backgroundColor: "white" }}
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
