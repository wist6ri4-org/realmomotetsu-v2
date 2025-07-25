import { GetDocumentsRequest, GetDocumentsResponse } from "./types";

export interface DocumentsService {
    /**
     * イベントコードに紐づくドキュメントを全件取得する
     * @param req - リクエストデータ
     * @return {Promise<GetDocumentsResponse>} ドキュメントのリスト
     */
    getDocumentsByEventCode: (req: GetDocumentsRequest) => Promise<GetDocumentsResponse>;
}
