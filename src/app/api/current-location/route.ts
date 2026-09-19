import { createApiHandler } from "@/app/api/utils/apiHandler";
import CurrentLocationApiHandler from "./CurrentLocationApiHandler";

export const POST = createApiHandler(CurrentLocationApiHandler);

export {}; // 明示的にモジュールとして認識させる
