import { createApiHandler } from "@/app/api/utils/apiHandler";
import ArrivalGoalStationV3ApiHandler from "./ArrivalGoalStationV3ApiHandler";

export const POST = createApiHandler(ArrivalGoalStationV3ApiHandler);

export {}; // 明示的にモジュールとして認識させる
