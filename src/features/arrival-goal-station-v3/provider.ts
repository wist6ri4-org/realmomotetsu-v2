import { ArrivalGoalStationV3Service } from "./interface";
import { ArrivalGoalStationV3ServiceImpl } from "./service";

/**
 * ArrivalGoalStationV3Serviceのインターフェースを提供するプロバイダー関数
 * @returns {ArrivalGoalStationV3Service} ArrivalGoalStationV3ServiceImpl
 */
export const getArrivalGoalStationV3Service = (): ArrivalGoalStationV3Service => {
    return ArrivalGoalStationV3ServiceImpl;
};
