import { createApiHandler } from "@/app/api/utils/apiHandler";
import InitRouletteApiHandler from "./InitRouletteApiHandler";

export const GET = createApiHandler(InitRouletteApiHandler);

export {}; // 明示的にモジュールとして認識させる
