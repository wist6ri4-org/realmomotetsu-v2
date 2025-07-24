import { createApiHandler } from "@/app/api/utils/apiHandler";
import BombiiHistoriesApiHandler from "./BombiiHistoriesApiHandler";

export const GET = createApiHandler(BombiiHistoriesApiHandler);
export const POST = createApiHandler(BombiiHistoriesApiHandler);
