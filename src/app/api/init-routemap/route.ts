import { createApiHandler } from "@/app/api/utils/apiHandler";
import InitRoutemapApiHandler from "./InitRoutemapApiHandler";

export const GET = createApiHandler(InitRoutemapApiHandler);

export {}; // 明示的にモジュールとして認識させる
