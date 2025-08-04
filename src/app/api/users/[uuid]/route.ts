import { createApiHandlerWithParams } from "@/app/api/utils/apiHandler";
import UsersByUuidApiHandler from "./UsersUuidApiHandler";

export const GET = createApiHandlerWithParams(UsersByUuidApiHandler);
export const PUT = createApiHandlerWithParams(UsersByUuidApiHandler);
