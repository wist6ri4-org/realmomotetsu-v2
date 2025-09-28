import { ApiError, InternalServerError } from "@/error";
import { DocumentsService } from "./interface";
import { GetDocumentsRequest, GetDocumentsResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";

export const DocumentsServiceImpl: DocumentsService = {
    /**
     * イベントコードに紐づくドキュメントを全件取得する
     * @param {GetDocumentsRequest} req - リクエスト
     * @return {Promise<GetDocumentsResponse>} レスポンス
     */
    async getDocumentsByEventCode(req: GetDocumentsRequest): Promise<GetDocumentsResponse> {
        const documentsRepository = RepositoryFactory.getDocumentsRepository();

        try {
            const eventCode = req.eventCode;
            const documents = await documentsRepository.findByEventCode(eventCode);
            const res: GetDocumentsResponse = {
                documents: documents,
            };

            return res;
        } catch (error) {
            if (error instanceof ApiError) {
                throw error;
            }

            throw new InternalServerError({
                message: `Failed in ${arguments.callee.name}. ${error instanceof Error ? error.message : ""}`,
            });
        }
    },
};
