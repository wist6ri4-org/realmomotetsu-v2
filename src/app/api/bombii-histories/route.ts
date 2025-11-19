import { createApiHandler } from "@/app/api/utils/apiHandler";
import BombiiHistoriesApiHandler from "./BombiiHistoriesApiHandler";

export const POST = createApiHandler(BombiiHistoriesApiHandler);

export {}; // 明示的にモジュールとして認識させる
