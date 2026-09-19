import { createApiHandler } from "@/app/api/utils/apiHandler";
import VerifyArrivalGoalStationV3ApiHandler from "./VerifyArrivalGoalStationV3ApiHandler";

export const POST = createApiHandler(VerifyArrivalGoalStationV3ApiHandler);

export {}; // 明示的にモジュールとして認識させる
