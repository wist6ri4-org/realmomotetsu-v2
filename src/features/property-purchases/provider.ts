import { PropertyPurchasesService } from "./interface"
import { PropertyPurchasesServiceImpl } from "./service";

/**
 * PropertyPurchasesServiceのインターフェースを提供するプロバイダー関数
 * @returns {PropertyPurchasesService} PropertyPurchasesServiceImpl
 */
export const getPropertyPurchasesService = (): PropertyPurchasesService => {
    return PropertyPurchasesServiceImpl;
}