import { createApiHandler } from "@/app/api/utils/apiHandler";
import TransitStationsApiHandler from "./TransitStationsApiHandler";

export const GET = createApiHandler(TransitStationsApiHandler);
export const POST = createApiHandler(TransitStationsApiHandler);

export {}; // 明示的にモジュールとして認識させる
