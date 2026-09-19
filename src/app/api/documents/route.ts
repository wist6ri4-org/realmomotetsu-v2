import { createApiHandler } from "@/app/api/utils/apiHandler";
import DocumentsApiHandler from "./DocumentsApiHandler";

export const GET = createApiHandler(DocumentsApiHandler);

export {}; // 明示的にモジュールとして認識させる
