/**
 * ルーレットフォーム（V3）
 */
"use client";

import { GoalStations, LatestTransitStations, Stations, StationType } from "@/generated/prisma";
import { TypeConverter } from "@/utils/typeConverter";
import { Box } from "@mui/material";
import React, { useEffect, useReducer, useRef, useState } from "react";
import { RouletteUtils } from "@/utils/rouletteUtils";
import CustomButton from "@/components/base/CustomButton";
import { NearbyStationsWithRelations } from "@/repositories/nearbyStations/NearbyStationsRepository";
import CustomRadio, { RadioOption } from "@/components/base/CustomRadio";
import RouletteCard from "../../base/RouletteCard";
import { useSelectInput } from "@/hooks/useSelectInput";
import { ClosestStation } from "@/types/ClosestStation";
import { useAlertDialog } from "@/hooks/useAlertDialog";
import AlertDialog from "@/components/base/AlertDialog";
import CustomAutoComplete from "@/components/base/CustomAutoComplete";
import LocationUtils from "@/utils/locationUtils";

/**
 * RouletteFormV3コンポーネントのプロパティ型定義
 * @property {Stations[]} stations - 駅のリスト
 * @property {NearbyStationsWithRelations[]} nearbyStations - 隣接駅情報のリスト
 * @property {TransitStations[]} latestTransitStations - 最新経由駅のリスト
 * @property {GoalStations[]} goalStations - 既出目的地駅のリスト
 * @property {number} latitude - 現在地の緯度
 * @property {number} longitude - 現在地の経度
 */
interface RouletteFormV3Props {
    stations: Stations[];
    nearbyStations: NearbyStationsWithRelations[];
    latestTransitStations: LatestTransitStations[];
    goalStations: GoalStations[];
    latitude: number;
    longitude: number;
}

// ルーレットモードのオプション
const rouletteModes: RadioOption[] = [
    { value: "weighted", label: "目的地" },
    { value: "random", label: "ぶっとび" },
];

/**
 * ルーレットフォームコンポーネント
 * @param {RouletteFormV3Props} props - RouletteFormV3のプロパティ
 * @returns {JSX.Element} - RouletteFormV3コンポーネント
 */
const RouletteFormV3: React.FC<RouletteFormV3Props> = ({
    stations,
    nearbyStations,
    latestTransitStations,
    goalStations,
    latitude,
    longitude,
}: RouletteFormV3Props): React.JSX.Element => {
    const [rouletteMode, setRouletteMode] = useState<"weighted" | "random">("weighted");
    const [targetStations, setTargetStations] = useState<Stations[]>(filterTargetStations(stations, rouletteMode));
    const [closestStation, setClosestStation] = useState<ClosestStation>(findClosestStation(stations, rouletteMode, latitude, longitude));
    const startStationCodeInput = useSelectInput(closestStation.stationCode || "");
    const spinIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [isRolling, setIsRolling] = useState<boolean>(false);

    const { isAlertOpen, alertOptions, showAlertDialog, handleAlertOk } = useAlertDialog();

    /**
     * ルーレットの次の駅を取得するための関数
     * @return {Stations | null} - 次の駅
     */
    const getWeightedStation = (): Stations | null => {
        const nextStationCode = RouletteUtils.getWeightedStationCodeV3(
            targetStations,
            nearbyStations,
            latestTransitStations,
            goalStations,
            startStationCodeInput.value
        );
        return stations.find((station) => station.stationCode === nextStationCode) || null;
    };

    /**
     * ランダムな駅を取得するための関数
     * @return {Stations | null} - ランダムな駅
     */
    const getRandomStation = (): Stations | null => {
        const randomStationCode = RouletteUtils.getRandomStationCode(targetStations, startStationCodeInput.value);
        return stations.find((station) => station.stationCode === randomStationCode) || null;
    };

    /**
     * ルーレットの状態を管理するためのリデューサー関数
     * @param {Stations | null} state - 現在の状態
     * @param {Object} action - アクションオブジェクト
     * @param {string} action.type - アクションのタイプ（"weighted" または "random"）
     * @return {Stations | null} - 更新された状態
     */
    const reducer = (state: Stations | null, action: { type: "weighted" | "random" }): Stations | null => {
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
        event: React.ChangeEvent<HTMLInputElement> | (Event & { target: { value: unknown; name: string } })
    ) => {
        const newValue = event.target.value as "weighted" | "random";
        setRouletteMode(newValue);
        console.log("選択されたルーレットモード:", newValue);

        setTargetStations(filterTargetStations(stations, newValue));
        setClosestStation(findClosestStation(stations, newValue, latitude, longitude));
        handleStop();
    };

    /**
     * ルーレットの開始ボタンが押されたときのハンドラー
     */
    const handleStart = () => {
        if (startStationCodeInput.value === "") {
            showAlertDialog({
                message: "今いる駅を選択してください。",
            });
            return;
        }
        setIsRolling(true);
        console.log(
            "Starting roulette with mode:",
            rouletteMode,
            "and start station:",
            startStationCodeInput.value
        );
    }

    /**
     * ルーレットの停止ボタンが押されたときのハンドラー
     */
    const handleStop = () => {
        setIsRolling(false);
        console.log("Stopping roulette（v3）, displaying next station:", displayedStation);
    };

    /**
     * ルーレットの開始・停止処理
     */
    useEffect(() => {
        if (!isRolling) {
            if (spinIntervalRef.current) {
                clearInterval(spinIntervalRef.current);
            }
            return;
        } else {
            spinIntervalRef.current = setInterval(() => {
                dispatch({ type: rouletteMode });
            }, 100);

            return () => {
                if (spinIntervalRef.current) {
                    clearInterval(spinIntervalRef.current);
                }
            }
        }
    }, [isRolling, rouletteMode]);

    return (
        <>
            <Box sx={{ display: "flex", flexDirection: "column", margin: 2 }}>
                <Box sx={{ marginBottom: 2 }}>
                    <CustomAutoComplete
                        options={TypeConverter.convertStationsToAutoCompleteOptions(targetStations)}
                        value={startStationCodeInput.value}
                        onChange={startStationCodeInput.handleChange}
                        size="small"
                        label="今いる駅"
                        fullWidth
                        required
                    ></CustomAutoComplete>
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
                                handleStart();
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
                                handleStop();
                            }}
                            fullWidth
                        >
                            ストップ
                        </CustomButton>
                    )}
                </Box>
            </Box>
            <AlertDialog
                isAlertOpen={isAlertOpen}
                title={alertOptions.title}
                message={alertOptions.message}
                onOk={handleAlertOk}
                okText={alertOptions.okText}
            />
        </>
    );
};

export default RouletteFormV3;

/**
 * 指定された駅の中からミッション駅のみを抽出する関数
 * @param {Stations[]} stations - 駅の配列
 * @param {string} rouletteMode - ルーレットのモード
 * @return {Stations[]} - ミッション駅のみの配列
 */
function filterTargetStations(stations: Stations[], rouletteMode: string): Stations[] {
    return rouletteMode === "weighted" ? stations.filter((station) => station.stationType === StationType.mission) : stations;
}

/**
 * 指定された駅の中から最も近い駅を見つける関数
 * @param {Stations[]} stations - 駅の配列
 * @param {string} rouletteMode - ルーレットのモード
 * @param {number} latitude - 現在の緯度
 * @param {number} longitude - 現在の経度
 * @return {ClosestStation} - 最も近い駅
 */
function findClosestStation(
    stations: Stations[],
    rouletteMode: string,
    latitude: number,
    longitude: number
): ClosestStation {
    const targetStations = filterTargetStations(stations, rouletteMode);
    return LocationUtils.calculate(targetStations, latitude, longitude)[0];
};