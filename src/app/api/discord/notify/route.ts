import { createApiHandler } from "@/app/api/utils/apiHandler";
import DiscordNotifyApiHandler from "./DiscordNotifyApiHandler";

export const POST = createApiHandler(DiscordNotifyApiHandler);

export {}; // 明示的にモジュールとして認識させる
