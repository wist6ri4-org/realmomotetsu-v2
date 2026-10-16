import { createApiHandler } from "@/app/api/utils/apiHandler";
import InitHomeApiHandler from "./InitHomeApiHandler";

export const GET = createApiHandler(InitHomeApiHandler);

export {}; // 明示的にモジュールとして認識させる
