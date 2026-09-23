import { createApiHandler } from "../utils/apiHandler";
import PropertyPurchasesApiHandler from "./PropertyPurchasesApiHandler";

export const GET = createApiHandler(PropertyPurchasesApiHandler);
export const POST = createApiHandler(PropertyPurchasesApiHandler);

export {}; // 明示的にモジュールとして認識させる