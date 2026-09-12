import { createApiHandler } from "@/app/api/utils/apiHandler";
import PointsBulkApiHandler from "./PointsBulkApiHandler";

export const POST = createApiHandler(PointsBulkApiHandler);

export {}; // 明示的にモジュールとして認識させる
