import { createApiHandler } from "@/app/api/utils/apiHandler";
import DocumentsApiHandler from "./DocumentsApiHandler";

export const GET = createApiHandler(DocumentsApiHandler);
