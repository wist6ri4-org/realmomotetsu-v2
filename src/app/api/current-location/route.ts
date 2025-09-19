import { createApiHandler } from "@/app/api/utils/apiHandler";
import BombiiHistoriesApiHandler from "./CurrentLocationApiHandler";

export const POST = createApiHandler(BombiiHistoriesApiHandler);

export {}; // 明示的にモジュールとして認識させる
