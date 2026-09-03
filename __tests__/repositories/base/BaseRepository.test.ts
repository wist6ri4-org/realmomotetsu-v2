/**
 * @jest-environment node
 */

import { BaseRepository, PrismaTransactionClient } from "@/repositories/base/BaseRepository";
import { PrismaClient } from "@/generated/prisma";

/** BaseRepositoryのprotectedメソッドを検証するためのテスト用サブクラス */
class TestRepository extends BaseRepository {
    async runTransaction<T>(operations: (tx: PrismaTransactionClient) => Promise<T>): Promise<T> {
        return this.executeTransaction(operations);
    }

    reportDatabaseError(error: unknown, operation: string): never {
        return this.handleDatabaseError(error, operation);
    }
}

describe("BaseRepository", () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe("executeTransaction", () => {
        it("prisma.$transactionに操作を委譲し、結果を返す", async () => {
            const transactionMock = jest.fn().mockResolvedValue("result");
            const prisma = { $transaction: transactionMock } as unknown as PrismaClient;
            const repository = new TestRepository(prisma);
            const operations = jest.fn().mockResolvedValue("result");

            const result = await repository.runTransaction(operations);

            expect(transactionMock).toHaveBeenCalledWith(operations);
            expect(result).toBe("result");
        });

        it("トランザクションが失敗した場合はログを出力してエラーを再スローする", async () => {
            const error = new Error("transaction failed");
            const prisma = {
                $transaction: jest.fn().mockRejectedValue(error),
            } as unknown as PrismaClient;
            const repository = new TestRepository(prisma);

            await expect(repository.runTransaction(jest.fn())).rejects.toThrow("transaction failed");
            expect(consoleErrorSpy).toHaveBeenCalledWith("Transaction failed:", error);
        });
    });

    describe("handleDatabaseError", () => {
        let repository: TestRepository;

        beforeEach(() => {
            repository = new TestRepository({} as PrismaClient);
        });

        it("一意制約違反のエラーは重複エラーに変換される", () => {
            expect(() =>
                repository.reportDatabaseError(new Error("Unique constraint failed"), "create"),
            ).toThrow("Duplicate entry in create");
        });

        it("外部キー制約違反のエラーは無効な参照エラーに変換される", () => {
            expect(() =>
                repository.reportDatabaseError(new Error("Foreign key constraint failed"), "create"),
            ).toThrow("Invalid reference in create");
        });

        it("その他のErrorインスタンスは操作名付きの汎用エラーに変換される", () => {
            expect(() => repository.reportDatabaseError(new Error("timeout"), "findByEventCode")).toThrow(
                "Database operation failed: findByEventCode",
            );
        });

        it("Errorインスタンスでない値も操作名付きの汎用エラーに変換される", () => {
            expect(() => repository.reportDatabaseError("unexpected", "delete")).toThrow(
                "Database operation failed: delete",
            );
        });

        it("エラー内容をコンソールに出力する", () => {
            const error = new Error("boom");
            expect(() => repository.reportDatabaseError(error, "update")).toThrow();
            expect(consoleErrorSpy).toHaveBeenCalledWith("Database error in update:", error);
        });
    });
});
