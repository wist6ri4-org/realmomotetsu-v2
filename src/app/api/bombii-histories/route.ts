import { createApiHandler } from "@/app/api/utils/apiHandler";
import GoalStationsApiHandler from "./BombiiHistoriesApiHandler";

export const GET = createApiHandler(GoalStationsApiHandler);
export const POST = createApiHandler(GoalStationsApiHandler);