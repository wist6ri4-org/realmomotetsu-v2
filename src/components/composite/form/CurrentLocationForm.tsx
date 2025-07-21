"use client";

import CustomButton from "@/components/base/CustomButton";
import CustomSelect from "@/components/base/CustomSelect";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { Stations, Teams } from "@/generated/prisma";
import theme from "@/theme";
import { TypeConverter } from "@/utils/typeConverter";
import { Assignment } from "@mui/icons-material";
import { Box, ThemeProvider } from "@mui/material";
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
}) => {
    const [selectedTeamCode, setSelectedTeamCode] = useState<string>("");
    const [selectedStationCode, setSelectedStationCode] = useState<string>(
        closestStations?.[0]?.stationCode ? String(closestStations?.[0]?.stationCode) : ""
    );

    /**
     * 選択されたチームIDの変更ハンドラー
     * @param event - イベントオブジェクト
     * @param event.target.value - 新しいチームIDの値
     * @param event.target.name - イベントの名前（オプション）
     */
    const handleSelectTeamIdChange = (
        event:
            | React.ChangeEvent<HTMLInputElement>
            | (Event & { target: { value: unknown; name: string } })
    ) => {
        const newValue = event.target.value as string;
        setSelectedTeamCode(newValue);
        console.log("選択されたチーム:", newValue);
    };

    /**
     * 選択された駅IDの変更ハンドラー
     * @param event - イベントオブジェクト
     * @param event.target.value - 新しい駅IDの値
     * @param event.target.name - イベントの名前（オプション）
     */
    const handleSelectStationIdChange = (
        event:
            | React.ChangeEvent<HTMLInputElement>
            | (Event & { target: { value: unknown; name: string } })
    ) => {
        const newValue = event.target.value as string;
        setSelectedStationCode(newValue);
        console.log("選択された駅:", newValue);
    };

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
        <ThemeProvider theme={theme}>
            <Box sx={{ marginX: 2 }}>
                <FormTitle
                    title="到着報告フォーム"
                    icon={<Assignment sx={{ fontSize: "3.5rem" }} />}
                />
                <FormDescription>
                    【いつ送る?】
                    <br />
                    １．サイコロを２回振ってカードを決定
                    <br />
                    ２．カードの効果を処理する
                    <br />
                    ３．もう一度サイコロを振って行き先を決定
                    <br />
                    ４．移動したら移動先の駅（今いる駅）をこのフォームから送信
                    <br />
                    ５．１～４を繰り返す
                    <br />
                </FormDescription>
                <Box sx={{ display: "flex", flexDirection: "column", margin: 2 }}>
                    <Box sx={{ marginBottom: 2 }}>
                        <CustomSelect
                            options={TypeConverter.convertTeamsToSelectOptions(teams)}
                            value={selectedTeamCode}
                            onChange={handleSelectTeamIdChange}
                            size="small"
                            label="チーム名"
                            fullWidth
                        />
                    </Box>
                    <Box sx={{ marginBottom: 2 }}>
                        <CustomSelect
                            options={TypeConverter.convertStationsToSelectOptions(stations)}
                            value={selectedStationCode}
                            onChange={handleSelectStationIdChange}
                            size="small"
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
        </ThemeProvider>
    );
};

export default CurrentLocationForm;
