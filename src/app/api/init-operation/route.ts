import { createApiHandler } from "@/app/api/utils/apiHandler";
import InitOperationApiHandler from "./InitOperationApiHandler";

export const GET = createApiHandler(InitOperationApiHandler);

export {}; // 明示的にモジュールとして認識させる
