import { createApiHandler } from "@/app/api/utils/apiHandler";
import LatestGoalStationsApiHandler from "./LatestGoalStationsApiHandler";

export const GET = createApiHandler(LatestGoalStationsApiHandler);
