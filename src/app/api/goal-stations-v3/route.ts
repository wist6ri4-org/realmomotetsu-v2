import { createApiHandler } from "@/app/api/utils/apiHandler";
import GoalStationsV3ApiHandler from "./GoalStationsV3ApiHandler";

export const POST = createApiHandler(GoalStationsV3ApiHandler);

export {}; // 明示的にモジュールとして認識させる
