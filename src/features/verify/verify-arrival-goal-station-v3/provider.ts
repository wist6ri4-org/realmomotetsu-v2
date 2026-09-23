import { VerifyArrivalGoalStationV3Service } from "./interface";
import { VerifyArrivalGoalStationV3ServiceImpl } from "./service";

/**
 * VerifyArrivalGoalStationV3Serviceのインターフェースを提供するプロバイダー関数
 * @returns {VerifyArrivalGoalStationV3Service} VerifyArrivalGoalStationV3ServiceImpl
 */
export const getVerifyArrivalGoalStationV3Service = (): VerifyArrivalGoalStationV3Service => {
    return VerifyArrivalGoalStationV3ServiceImpl;
};
