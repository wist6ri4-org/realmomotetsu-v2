import { createApiHandler } from "@/app/api/utils/apiHandler";
import InitApiHandler from "./InitApiHandler";

export const GET = createApiHandler(InitApiHandler);

export {}; // 明示的にモジュールとして認識させる
