import { createApiHandler } from "@/app/api/utils/apiHandler";
import InitFormApiHandler from "./initFormApiHandler";

export const GET = createApiHandler(InitFormApiHandler);

export {}; // 明示的にモジュールとして認識させる
