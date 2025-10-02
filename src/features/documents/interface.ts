import { GetDocumentsRequest, GetDocumentsResponse } from "./types";

export interface DocumentsService {
    /**
     * イベントコードに紐づくドキュメントを全件取得する
     * @param {GetDocumentsRequest} req - リクエスト
     * @return {Promise<GetDocumentsResponse>} レスポンス
     */
    getDocumentsByEventCode: (req: GetDocumentsRequest) => Promise<GetDocumentsResponse>;
}
