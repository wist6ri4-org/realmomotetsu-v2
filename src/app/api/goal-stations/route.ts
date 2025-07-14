import { createApiHandler } from "@/app/api/utils/apiHandler";
import GoalStationsApiHandler from "./GoalStationsApiHandler";

export const GET = createApiHandler(GoalStationsApiHandler);
export const POST = createApiHandler(GoalStationsApiHandler);