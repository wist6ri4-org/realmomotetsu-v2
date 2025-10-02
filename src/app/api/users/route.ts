import { createApiHandler } from "@/app/api/utils/apiHandler";
import UsersApiHandler from "./UsersApiHandler";

export const POST = createApiHandler(UsersApiHandler);

export {}; // 明示的にモジュールとして認識させる
