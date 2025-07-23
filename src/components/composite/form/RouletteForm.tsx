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
interface RouletteFormProps {
    stations: Stations[];
    nearbyStations: NearbyStationsWithRelations[];
    latestTransitStations: TransitStations[];
    closestStations: Stations[];
}

const rouletteModes: RadioOption[] = [
    { value: "weighted", label: "目的地" },
    { value: "random", label: "ぶっとび" },
];

const RouletteForm: React.FC<RouletteFormProps> = ({
    stations,
    nearbyStations,
    latestTransitStations,
    closestStations,
}): React.JSX.Element => {
    const startStationCodeInput =useSelectInput(closestStations?.[0]?.stationCode || "");
    const [rouletteMode, setRouletteMode] = useState<"weighted" | "random">("weighted");
    const [spinInterval, setSpinInterval] = useState<NodeJS.Timeout | null>(null);
    const [isRolling, setIsRolling] = useState<boolean>(false);

    const getWeightedStation = () => {
        const nextStationCode = RouletteUtils.getWeightedStationCode(
            nearbyStations,
            latestTransitStations,
            startStationCodeInput.value,
        );
        return stations.find((station) => station.stationCode === nextStationCode) || null;
    };

    const getRandomStation = () => {
        const randomStationCode = RouletteUtils.getRandomStationCode(stations, startStationCodeInput.value);
        return stations.find((station) => station.stationCode === randomStationCode) || null;
    };

    const reducer = (state: Stations | null, action: { type: "weighted" | "random" }) => {
        switch (action.type) {
            case "weighted":
                return getWeightedStation();
            case "random":
                return getRandomStation();
        }
    };
    const [displayedStation, dispatch] = useReducer(reducer, null);

    const handleRouletteModeChange = (
        event:
            | React.ChangeEvent<HTMLInputElement>
            | (Event & { target: { value: unknown; name: string } })
    ) => {
        const newValue = event.target.value as "weighted" | "random";
        setRouletteMode(newValue);
        console.log("選択されたルーレットモード:", newValue);
    };

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
