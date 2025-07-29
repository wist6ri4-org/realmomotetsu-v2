import { createApiHandler } from "@/app/api/utils/apiHandler";
import LatestTransitStationsApiHandler from "./LatestTransitStationsApiHandler";

export const GET = createApiHandler(LatestTransitStationsApiHandler);
