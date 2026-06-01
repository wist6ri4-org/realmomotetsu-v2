/**
 * マス数計算ツールフォーム
 */
"use client";

import AlertDialog from "@/components/base/AlertDialog";
import CustomAutoComplete from "@/components/base/CustomAutoComplete";
import CustomButton from "@/components/base/CustomButton";
import FormDescription from "@/components/base/FormDescription";
import FormTitle from "@/components/base/FormTitle";
import { Stations } from "@/generated/prisma";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import { useSelectInput } from "@/hooks/useSelectInput";
import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";
import DijkstraUtils from "@/utils/dijkstraUtils";
import { TypeConverter } from "@/utils/typeConverter";
import { Box } from "@mui/material";
import React, { useState } from "react";

/**
 * CalculateDistanceToolFormコンポーネントのプロパティ型定義
 * @property {Stations[]} stations - 駅のリスト
 * @property {NearbyStationsWithRelations[]} nearbyStations - 隣接駅情報のリスト
 */
interface CalculateDistanceToolFormProps {
    stations: Stations[];
    nearbyStations: NearbyStationsWithRelations[];
}

/**
 * マス数計算ツールフォームコンポーネント
 * @returns {JSX.Element} - CalculateDistanceToolFormコンポーネント
 */
const CalculateDistanceToolForm: React.FC<CalculateDistanceToolFormProps> = (
    { stations, nearbyStations }
): React.JSX.Element => {
    const selectedStartStationCodeInput = useSelectInput(
        stations?.[0]?.stationCode ? String(stations?.[0]?.stationCode) : ""
    );
    const selectedGoalStationCodeInput = useSelectInput(
        stations?.[0]?.stationCode ? String(stations?.[0]?.stationCode) : ""
    );

    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    const [isLoading, setIsLoading] = useState<boolean>(false);

    /**
     * ２駅間の最短距離のマス数を計算する
     * @return {Promise<void>} - 計算処理の完了を示すPromise
     */
    const calculateDistance = async (): Promise<void> => {
        setIsLoading(true);

        const startStationCode = selectedStartStationCodeInput.value;
        const goalStationCode = selectedGoalStationCodeInput.value;

        const distance = startStationCode === goalStationCode
            ? 0
            : DijkstraUtils.calculateRemainingStationsNumber(
                DijkstraUtils.convertNearbyStationsToStationGraph(nearbyStations),
                startStationCode,
                goalStationCode
            );

        const alertMessage = `駅数は ${distance} です。`;
        await showAlertDialog({
            title: "計算結果",
            message: alertMessage,
            buttonColor: "primary",
        });

        setIsLoading(false);
    };

    /**
     * フォームをリセットする
     * @return {void}
     */
    const resetForm = (): void => {
        selectedStartStationCodeInput.reset();
        selectedGoalStationCodeInput.reset();
    };

    return (
        <>
            <FormTitle title="マス数計算ツール" />
            <FormDescription>２駅間の最短距離のマス数を計算する。</FormDescription>
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
                    <CustomAutoComplete
                        options={TypeConverter.convertStationsToAutoCompleteOptions(stations)}
                        value={selectedStartStationCodeInput.value}
                        onChange={selectedStartStationCodeInput.handleChange}
                        size="small"
                        variant="outlined"
                        label="開始駅"
                        fullWidth
                        required
                        disabled={isLoading}
                    />
                </Box>
                <Box sx={{ marginBottom: 2 }}>
                    <CustomAutoComplete
                        options={TypeConverter.convertStationsToAutoCompleteOptions(stations)}
                        value={selectedGoalStationCodeInput.value}
                        onChange={selectedGoalStationCodeInput.handleChange}
                        size="small"
                        variant="outlined"
                        label="終了駅"
                        fullWidth
                        required
                        disabled={isLoading}
                    />
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
                    <CustomButton onClick={calculateDistance} disabled={isLoading} color="success">
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
                buttonColor={alertOptions.buttonColor}
            />
        </>
    );
};

export default CalculateDistanceToolForm;
