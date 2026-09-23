import { PointsBulkService } from "./interface";
import { PointsBulkServiceImpl } from "./service";

/**
 * PointsBulkServiceのインターフェースを提供するプロバイダー関数
 * @returns {PointsBulkService} PointsBulkServiceImpl
 */
export const getPointsBulkService = (): PointsBulkService => {
    return PointsBulkServiceImpl;
};
