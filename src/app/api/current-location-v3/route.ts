import { createApiHandler } from "@/app/api/utils/apiHandler";
import CurrentLocationV3ApiHandler from "./CurrentLocationV3ApiHandler";

export const POST = createApiHandler(CurrentLocationV3ApiHandler);

export {}; // 明示的にモジュールとして認識させる
