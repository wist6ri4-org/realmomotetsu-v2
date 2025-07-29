import { createApiHandlerWithParams } from "@/app/api/utils/apiHandler";
import EventsByEventCodeApiHandler from "./EventsByEventCodeApiHandler";

export const GET = createApiHandlerWithParams(EventsByEventCodeApiHandler);
