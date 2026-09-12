/**
 * @jest-environment node
 */

import { StatusCode } from "@/constants/statuscode";
import { ResourceNotFoundError } from "@/error";
import { TEST_EVENT_CODE, buildDocument } from "../../../helpers/factories";
import {
    buildGetRequest,
    buildRequestWithMethod,
    readResponse,
    silenceApiLogs,
} from "../../../helpers/apiRequest";

// DocumentsApiHandlerはDocumentsServiceImplを直接importして呼び出すため、モジュールごとモックする
jest.mock("@/features/documents/service", () => ({
    DocumentsServiceImpl: {
        getDocumentsByEventCode: jest.fn(),
    },
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DocumentsServiceImpl } = jest.requireMock("@/features/documents/service") as {
    DocumentsServiceImpl: {
        getDocumentsByEventCode: jest.Mock;
    };
};

// jest.mockはモジュールの評価前に巻き上げられるため、モック定義後にインポートする
import DocumentsApiHandler from "@/app/api/documents/DocumentsApiHandler";

describe("DocumentsApiHandler", () => {
    beforeEach(() => {
        silenceApiLogs();
        DocumentsServiceImpl.getDocumentsByEventCode.mockReset();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("GET", () => {
        it("イベントコードをServiceに渡し、ドキュメント一覧を返す", async () => {
            const documents = [buildDocument({ id: 1 }), buildDocument({ id: 2, name: "資料2" })];
            DocumentsServiceImpl.getDocumentsByEventCode.mockResolvedValue({ documents });

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new DocumentsApiHandler(req).handle());

            expect(DocumentsServiceImpl.getDocumentsByEventCode).toHaveBeenCalledWith({
                eventCode: TEST_EVENT_CODE,
            });
            expect(status).toBe(StatusCode.OK);
            expect(body).toHaveProperty("data");
        });

        it("eventCodeが欠けている場合は400を返す", async () => {
            const req = buildGetRequest({});
            const { status, body } = await readResponse(await new DocumentsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(body.error).toBe("Validation failed");
            expect(DocumentsServiceImpl.getDocumentsByEventCode).not.toHaveBeenCalled();
        });

        it("eventCodeが空文字の場合は400を返す", async () => {
            const req = buildGetRequest({ eventCode: "" });
            const { status } = await readResponse(await new DocumentsApiHandler(req).handle());

            expect(status).toBe(StatusCode.BAD_REQUEST);
            expect(DocumentsServiceImpl.getDocumentsByEventCode).not.toHaveBeenCalled();
        });

        it("ServiceがApiErrorを投げた場合は対応するステータスコードを返す", async () => {
            DocumentsServiceImpl.getDocumentsByEventCode.mockRejectedValue(
                new ResourceNotFoundError("Event", TEST_EVENT_CODE),
            );

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new DocumentsApiHandler(req).handle());

            expect(status).toBe(StatusCode.NOT_FOUND);
            expect(body.errorCode).toBe("RESOURCE_NOT_FOUND");
        });

        it("Serviceが想定外のエラーを投げた場合は500を返し、内部のエラーメッセージを含まない", async () => {
            DocumentsServiceImpl.getDocumentsByEventCode.mockRejectedValue(new Error("DB connection lost"));

            const req = buildGetRequest({ eventCode: TEST_EVENT_CODE });
            const { status, body } = await readResponse(await new DocumentsApiHandler(req).handle());

            expect(status).toBe(StatusCode.INTERNAL_SERVER_ERROR);
            expect(JSON.stringify(body)).not.toContain("DB connection lost");
        });
    });

    describe("未対応のHTTPメソッド", () => {
        it.each([["POST"], ["PUT"], ["DELETE"], ["PATCH"]])("%sは405を返す", async (method) => {
            const req = buildRequestWithMethod(method);
            const { status, body } = await readResponse(await new DocumentsApiHandler(req).handle());

            expect(status).toBe(StatusCode.METHOD_NOT_ALLOWED);
            expect(body.error).toBe(`Method ${method} not allowed`);
        });
    });
});
