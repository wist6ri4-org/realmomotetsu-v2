import { createApiHandler } from "@/app/api/utils/apiHandler";
import LatestGoalStationsApiHandler from "./LatestGoalStationsApiHandler";

export const GET = createApiHandler(LatestGoalStationsApiHandler);

export {}; // 明示的にモジュールとして認識させる
