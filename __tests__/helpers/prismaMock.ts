/**
 * Repository層テスト用のPrismaClientモックヘルパー
 *
 * `jest-mock-extended`の`mockDeep`でPrismaClientの全メソッドをモック化する。
 * 使用するメソッドだけ`mockResolvedValue`等で戻り値を設定すればよく、
 * 未設定のメソッドを誤って呼んでもモック関数として扱われるため型エラーにならない。
 */

import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { PrismaClient } from "@/generated/prisma";
import { PrismaTransactionClient } from "@/repositories/base/BaseRepository";

/** モック化されたPrismaClientの型 */
export type MockPrismaClient = DeepMockProxy<PrismaClient>;

/** モック化されたトランザクションクライアントの型 */
export type MockPrismaTransactionClient = DeepMockProxy<PrismaTransactionClient>;

/**
 * モック化されたPrismaClientを生成する
 * @return {MockPrismaClient} モック化されたPrismaClient
 */
export const createPrismaMock = (): MockPrismaClient => mockDeep<PrismaClient>();

/**
 * モック化されたトランザクションクライアントを生成する
 * @description `PrismaTransactionClient`はPrismaClientから一部メソッドを除いた型のため、
 *              個別にモックする。トランザクション内の分岐（tx指定時にtx側が使われること）
 *              を検証する際に、通常のprismaモックと区別するために使う。
 * @return {MockPrismaTransactionClient} モック化されたトランザクションクライアント
 */
export const createPrismaTransactionMock = (): MockPrismaTransactionClient =>
    mockDeep<PrismaTransactionClient>();
