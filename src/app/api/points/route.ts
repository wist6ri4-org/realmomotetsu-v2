import { createApiHandler } from "@/app/api/utils/apiHandler";
import PointsApiHandler from "./PointsApiHandler";

export const GET = createApiHandler(PointsApiHandler);
export const POST = createApiHandler(PointsApiHandler);
export const PUT = createApiHandler(PointsApiHandler);

export {}; // 明示的にモジュールとして認識させる
