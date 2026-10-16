/**
 * @jest-environment node
 */

import { DocumentsRepository } from "@/repositories/documents/DocumentsRepository";
import { buildDocument } from "../../helpers/factories";
import { createPrismaMock, MockPrismaClient } from "../../helpers/prismaMock";

describe("DocumentsRepository", () => {
    let prisma: MockPrismaClient;
    let repository: DocumentsRepository;

    beforeEach(() => {
        prisma = createPrismaMock();
        repository = new DocumentsRepository(prisma);
        jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("findByEventCode", () => {
        it("イベントコードで絞り込み、表示順・ID順の昇順で取得する", async () => {
            const documents = [buildDocument({ id: 1, order: 0 }), buildDocument({ id: 2, order: 1 })];
            prisma.documents.findMany.mockResolvedValue(documents);

            const result = await repository.findByEventCode("TEST_EVENT");

            expect(prisma.documents.findMany).toHaveBeenCalledWith({
                where: { eventCode: "TEST_EVENT" },
                orderBy: [{ order: "asc" }, { id: "asc" }],
            });
            expect(result).toBe(documents);
        });

        it("DBエラー時はhandleDatabaseErrorにより汎用エラーへ変換される", async () => {
            prisma.documents.findMany.mockRejectedValue(new Error("timeout"));

            await expect(repository.findByEventCode("TEST_EVENT")).rejects.toThrow(
                "Database operation failed: findByEventCode",
            );
        });
    });
});
