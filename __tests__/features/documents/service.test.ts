/**
 * @jest-environment node
 */

import { ConflictError, InternalServerError } from "@/error";
import { DocumentsServiceImpl } from "@/features/documents/service";
import { TEST_EVENT_CODE, buildDocument } from "../../helpers/factories";
import { mockRepositories } from "../../helpers/repositoryMocks";

describe("DocumentsServiceImpl", () => {
    /** 各テストで参照するRepositoryのモックメソッド */
    let findByEventCode: jest.Mock;

    beforeEach(() => {
        findByEventCode = jest.fn().mockResolvedValue([]);

        mockRepositories({ documents: { findByEventCode } });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("getDocumentsByEventCode", () => {
        it("イベントコードで取得したドキュメントをそのまま返す", async () => {
            const documents = [
                buildDocument({ id: 1, order: 0 }),
                buildDocument({ id: 2, order: 1 }),
            ];
            findByEventCode.mockResolvedValue(documents);

            const res = await DocumentsServiceImpl.getDocumentsByEventCode({ eventCode: TEST_EVENT_CODE });

            expect(findByEventCode).toHaveBeenCalledWith(TEST_EVENT_CODE);
            expect(res.documents).toEqual(documents);
        });

        it("ドキュメントが1件もない場合は空配列を返す", async () => {
            const res = await DocumentsServiceImpl.getDocumentsByEventCode({ eventCode: TEST_EVENT_CODE });

            expect(res.documents).toEqual([]);
        });

        it("想定外のエラーはInternalServerErrorに変換される", async () => {
            findByEventCode.mockRejectedValue(new Error("DB connection lost"));

            await expect(
                DocumentsServiceImpl.getDocumentsByEventCode({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toThrow(InternalServerError);
        });

        it("ApiErrorはそのまま再スローされる", async () => {
            const apiError = new ConflictError({ message: "conflict" });
            findByEventCode.mockRejectedValue(apiError);

            await expect(
                DocumentsServiceImpl.getDocumentsByEventCode({ eventCode: TEST_EVENT_CODE }),
            ).rejects.toBe(apiError);
        });
    });
});
