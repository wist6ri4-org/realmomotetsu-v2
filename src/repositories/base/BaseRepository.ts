import { PrismaClient } from "@/generated/prisma";

/**
 * 基底Repositoryクラス
 * 共通のデータベース操作やエラーハンドリングを提供
 */
export abstract class BaseRepository {
    protected prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * トランザクション内で複数の操作を実行
     * @param operations - トランザクション内で実行する操作の配列
     */
    protected async executeTransaction<T>(
        operations: (
            tx: Omit<
                PrismaClient,
                "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
            >
        ) => Promise<T>
    ): Promise<T> {
        try {
            return await this.prisma.$transaction(operations);
        } catch (error) {
            console.error("Transaction failed:", error);
            throw error;
        }
    }

    /**
     * 共通のエラーハンドリング
     * @param error - Prismaエラー
     * @param operation - 実行していた操作名
     */
    protected handleDatabaseError(error: unknown, operation: string): never {
        console.error(`Database error in ${operation}:`, error);

        // Prismaの特定のエラーに応じてカスタムエラーを投げる
        if (error instanceof Error) {
            if (error.message.includes("Unique constraint")) {
                throw new Error(`Duplicate entry in ${operation}`);
            }
            if (error.message.includes("Foreign key constraint")) {
                throw new Error(`Invalid reference in ${operation}`);
            }
        }

        throw new Error(`Database operation failed: ${operation}`);
    }
}
