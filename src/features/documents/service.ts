import { DocumentsService } from "./interface";
import { GetDocumentsRequest, GetDocumentsResponse } from "./types";
import { RepositoryFactory } from "@/repositories/RepositoryFactory";

export const DocumentsServiceImpl: DocumentsService = {
    /**
     * イベントコードに紐づくドキュメントを全件取得する
     * @param req - リクエストデータ
     * @return {Promise<GetDocumentsResponse>} ドキュメントのリスト
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
            console.error("Error in getDocumentsByEventCode:", error);
            throw new Error("Failed to retrieve get goal stations");
        }
    },
};
