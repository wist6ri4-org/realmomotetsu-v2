import { createApiHandlerWithParams } from "@/app/api/utils/apiHandler";
import EventByEventCodeApiHandler from "./EventsByEventCodeApiHandler";

export const GET = createApiHandlerWithParams(EventByEventCodeApiHandler);
