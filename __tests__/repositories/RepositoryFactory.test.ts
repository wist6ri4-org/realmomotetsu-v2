/**
 * @jest-environment node
 */

jest.mock("@/lib/prisma", () => ({
    prisma: { $transaction: jest.fn() },
}));

import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { prisma } from "@/lib/prisma";
import { TeamsRepository } from "@/repositories/teams/TeamsRepository";
import { PointsRepository } from "@/repositories/points/PointsRepository";

describe("RepositoryFactory", () => {
    afterEach(() => {
        RepositoryFactory.resetAll();
        jest.restoreAllMocks();
    });

    describe("get*Repositoryメソッド", () => {
        it("同じRepositoryのインスタンスを再利用する（シングルトン）", () => {
            const first = RepositoryFactory.getTeamsRepository();
            const second = RepositoryFactory.getTeamsRepository();

            expect(first).toBeInstanceOf(TeamsRepository);
            expect(first).toBe(second);
        });

        it("異なるRepositoryは別々のインスタンスを返す", () => {
            const teams = RepositoryFactory.getTeamsRepository();
            const points = RepositoryFactory.getPointsRepository();

            expect(teams).toBeInstanceOf(TeamsRepository);
            expect(points).toBeInstanceOf(PointsRepository);
        });
    });

    describe("resetAll", () => {
        it("リセット後にgetterを呼ぶと新しいインスタンスが生成される", () => {
            const before = RepositoryFactory.getTeamsRepository();

            RepositoryFactory.resetAll();
            const after = RepositoryFactory.getTeamsRepository();

            expect(after).not.toBe(before);
        });
    });

    describe("withTransaction", () => {
        it("prisma.$transactionに操作を委譲し、結果を返す", async () => {
            const transactionMock = prisma.$transaction as jest.Mock;
            transactionMock.mockResolvedValue("result");
            const operations = jest.fn();

            const result = await RepositoryFactory.withTransaction(operations);

            expect(transactionMock).toHaveBeenCalledWith(operations);
            expect(result).toBe("result");
        });
    });
});
