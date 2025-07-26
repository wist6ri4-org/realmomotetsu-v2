/**
 * ルーレットフォーム
 */
"use client";

import CustomSelect from "@/components/base/CustomSelect";
import { Stations, TransitStations } from "@/generated/prisma";
import { TypeConverter } from "@/utils/typeConverter";
import { Box } from "@mui/material";
import React, { useEffect, useReducer, useState } from "react";
import { RouletteUtils } from "@/utils/rouletteUtils";
import CustomButton from "@/components/base/CustomButton";
import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";
import CustomRadio, { RadioOption } from "@/components/base/CustomRadio";
import RouletteCard from "../../base/RouletteCard";
import { useSelectInput } from "@/hooks/useSelectInput";
import { ClosestStation } from "@/types/ClosestStation";

/**
 * RouletteFormコンポーネントのプロパティ型定義
 * @property {Stations[]} stations - 駅のリスト
 * @property {NearbyStationsWithRelations[]} nearbyStations - 最寄り駅のリスト
 * @property {TransitStations[]} latestTransitStations - 最新の乗り換え駅のリスト
 * @property {Stations[]} closestStations - 最寄り駅のリスト
 */
interface RouletteFormProps {
    stations: Stations[];
    nearbyStations: NearbyStationsWithRelations[];
    latestTransitStations: TransitStations[];
    closestStations: ClosestStation[];
}

// ルーレットモードのオプション
const rouletteModes: RadioOption[] = [
    { value: "weighted", label: "目的地" },
    { value: "random", label: "ぶっとび" },
];

/**
 * ルーレットフォームコンポーネント
 * @param {RouletteFormProps} props - RouletteFormのプロパティ
 * @returns {JSX.Element} - RouletteFormコンポーネント
 */
const RouletteForm: React.FC<RouletteFormProps> = ({
    stations,
    nearbyStations,
    latestTransitStations,
    closestStations,
}: RouletteFormProps): React.JSX.Element => {
    const startStationCodeInput = useSelectInput(closestStations?.[0]?.stationCode || "");
    const [rouletteMode, setRouletteMode] = useState<"weighted" | "random">("weighted");
    const [spinInterval, setSpinInterval] = useState<NodeJS.Timeout | null>(null);
    const [isRolling, setIsRolling] = useState<boolean>(false);

    /**
     * ルーレットの次の駅を取得するための関数
     * @return {Stations | null} - 次の駅
     */
    const getWeightedStation = (): Stations | null => {
        const nextStationCode = RouletteUtils.getWeightedStationCode(
            nearbyStations,
            latestTransitStations,
            startStationCodeInput.value
        );
        return stations.find((station) => station.stationCode === nextStationCode) || null;
    };

    /**
     * ランダムな駅を取得するための関数
     * @return {Stations | null} - ランダムな駅
     */
    const getRandomStation = (): Stations | null => {
        const randomStationCode = RouletteUtils.getRandomStationCode(
            stations,
            startStationCodeInput.value
        );
        return stations.find((station) => station.stationCode === randomStationCode) || null;
    };

    /**
     * ルーレットの状態を管理するためのリデューサー関数
     * @param {Stations | null} state - 現在の状態
     * @param {Object} action - アクションオブジェクト
     * @param {string} action.type - アクションのタイプ（"weighted" または "random"）
     * @return {Stations | null} - 更新された状態
     */
    const reducer = (
        state: Stations | null,
        action: { type: "weighted" | "random" }
    ): Stations | null => {
        switch (action.type) {
            case "weighted":
                return getWeightedStation();
            case "random":
                return getRandomStation();
        }
    };
    const [displayedStation, dispatch] = useReducer(reducer, null);

    /**
     * ルーレットモードの変更ハンドラー
     * @param {React.ChangeEvent<HTMLInputElement> | Event} event - イベントオブジェクト
     */
    const handleRouletteModeChange = (
        event:
            | React.ChangeEvent<HTMLInputElement>
            | (Event & { target: { value: unknown; name: string } })
    ) => {
        const newValue = event.target.value as "weighted" | "random";
        setRouletteMode(newValue);
        console.log("選択されたルーレットモード:", newValue);
    };

    /**
     * ルーレットの開始・停止処理
     */
    useEffect(() => {
        if (!isRolling) {
            if (spinInterval) {
                clearInterval(spinInterval);
                console.log("Stopping roulette, displaying next station:", displayedStation);
            }
        } else {
            console.log(
                "Starting roulette with mode:",
                rouletteMode,
                "and start station:",
                startStationCodeInput.value
            );
            if (spinInterval) {
                clearInterval(spinInterval);
            }
            const interval = setInterval(() => {
                dispatch({ type: rouletteMode });
            }, 100);
            setSpinInterval(interval);
        }
    }, [isRolling]);

    return (
        <>
            <Box sx={{ display: "flex", flexDirection: "column", margin: 2 }}>
                <Box sx={{ marginBottom: 2 }}>
                    <CustomSelect
                        options={TypeConverter.convertStationsToSelectOptions(stations)}
                        value={startStationCodeInput.value}
                        onChange={startStationCodeInput.handleChange}
                        size="small"
                        label="今いる駅"
                        fullWidth
                    ></CustomSelect>
                </Box>
                <Box sx={{ marginBottom: 2 }}>
                    <CustomRadio
                        options={rouletteModes}
                        value={rouletteMode}
                        onChange={handleRouletteModeChange}
                        size="medium"
                        label="モード"
                        row={true}
                    ></CustomRadio>
                </Box>
                <RouletteCard displayedStation={displayedStation} />
                <Box sx={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                    {!isRolling ? (
                        <CustomButton
                            variant="contained"
                            color="success"
                            onClick={() => {
                                setIsRolling(true);
                            }}
                            fullWidth
                        >
                            スタート
                        </CustomButton>
                    ) : (
                        <CustomButton
                            variant="contained"
                            color="error"
                            onClick={() => {
                                setIsRolling(false);
                            }}
                            fullWidth
                        >
                            ストップ
                        </CustomButton>
                    )}
                </Box>
            </Box>
        </>
    );
};

export default RouletteForm;
