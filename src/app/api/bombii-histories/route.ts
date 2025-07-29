import { createApiHandler } from "@/app/api/utils/apiHandler";
import BombiiHistoriesApiHandler from "./BombiiHistoriesApiHandler";

export const POST = createApiHandler(BombiiHistoriesApiHandler);
