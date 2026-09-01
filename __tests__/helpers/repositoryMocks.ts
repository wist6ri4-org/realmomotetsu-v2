/**
 * Service層テスト用のRepositoryモックヘルパー
 *
 * Serviceは`RepositoryFactory.getXxxRepository()`でRepositoryを取得するため、
 * Factoryのgetterをspyでモックに差し替えることでDBに触れずにビジネスロジックを検証できる。
 */

import { RepositoryFactory } from "@/repositories/RepositoryFactory";
import { PrismaTransactionClient } from "@/repositories/base/BaseRepository";
import { BombiiHistoriesRepository } from "@/repositories/bombiiHistories/BombiiHistoriesRepository";
import { DocumentsRepository } from "@/repositories/documents/DocumentsRepository";
import { EventsRepository } from "@/repositories/events/EventsRepository";
import { EventTypesRepository } from "@/repositories/eventTypes/EventTypesRepository";
import { GoalStationsRepository } from "@/repositories/goalStations/GoalStationsRepository";
import { NearbyStationsRepository } from "@/repositories/nearbyStations/NearbyStationsRepository";
import { PointsRepository } from "@/repositories/points/PointsRepository";
import { PropertyPurchasesRepository } from "@/repositories/propertyPurchases/PropertyPurchasesRepository";
import { StationsRepository } from "@/repositories/stations/StationsRepository";
import { TeamsRepository } from "@/repositories/teams/TeamsRepository";
import { TransitStationsRepository } from "@/repositories/transitStations/TransitStationsRepository";
import { UsersRepository } from "@/repositories/users/UsersRepository";

/** モック化するRepositoryの型（必要なメソッドだけ定義すればよい） */
type RepositoryMock<T> = Partial<Record<keyof T, jest.Mock>>;

/**
 * モックに差し替えるRepositoryの一覧
 * @description 指定したRepositoryのみが差し替えられる。未指定のものは実装のまま。
 */
export type RepositoryMocks = {
    bombiiHistories?: RepositoryMock<BombiiHistoriesRepository>;
    documents?: RepositoryMock<DocumentsRepository>;
    events?: RepositoryMock<EventsRepository>;
    eventTypes?: RepositoryMock<EventTypesRepository>;
    goalStations?: RepositoryMock<GoalStationsRepository>;
    nearbyStations?: RepositoryMock<NearbyStationsRepository>;
    points?: RepositoryMock<PointsRepository>;
    propertyPurchases?: RepositoryMock<PropertyPurchasesRepository>;
    stations?: RepositoryMock<StationsRepository>;
    teams?: RepositoryMock<TeamsRepository>;
    transitStations?: RepositoryMock<TransitStationsRepository>;
    users?: RepositoryMock<UsersRepository>;
};

/** RepositoryFactoryのgetterと、モック定義のキーの対応表 */
const FACTORY_GETTERS = {
    bombiiHistories: "getBombiiHistoriesRepository",
    documents: "getDocumentsRepository",
    events: "getEventsRepository",
    eventTypes: "getEventTypesRepository",
    goalStations: "getGoalStationsRepository",
    nearbyStations: "getNearbyStationsRepository",
    points: "getPointsRepository",
    propertyPurchases: "getPropertyPurchasesRepository",
    stations: "getStationsRepository",
    teams: "getTeamsRepository",
    transitStations: "getTransitStationsRepository",
    users: "getUsersRepository",
} as const satisfies Record<keyof RepositoryMocks, keyof typeof RepositoryFactory>;

/**
 * RepositoryFactoryのgetterをモックに差し替える
 * @param {RepositoryMocks} mocks - 差し替えるRepositoryのモック
 */
export const mockRepositories = (mocks: RepositoryMocks): void => {
    (Object.keys(mocks) as Array<keyof RepositoryMocks>).forEach((key) => {
        const mock = mocks[key];
        if (!mock) {
            return;
        }
        jest.spyOn(RepositoryFactory, FACTORY_GETTERS[key]).mockReturnValue(mock as never);
    });
};

/**
 * `RepositoryFactory.withTransaction`をモックし、コールバックをそのまま実行させる
 * @description トランザクションの有無ではなく、トランザクション内のロジックを検証するためのヘルパー。
 *              コールバックには「渡されたことが確認できる」ダミーのトランザクションクライアントを渡す。
 * @return {PrismaTransactionClient} コールバックに渡されるダミーのトランザクションクライアント
 */
export const mockWithTransaction = (): PrismaTransactionClient => {
    const tx = { __isMockTransaction: true } as unknown as PrismaTransactionClient;
    jest.spyOn(RepositoryFactory, "withTransaction").mockImplementation(
        async (operations) => await operations(tx),
    );
    return tx;
};

/**
 * `RepositoryFactory.withTransaction`をモックし、トランザクション内の処理を実行せずに失敗させる
 * @description トランザクションのロールバック時の挙動を検証するためのヘルパー。
 * @param {Error} error - スローさせるエラー
 */
export const mockWithTransactionFailure = (error: Error): void => {
    jest.spyOn(RepositoryFactory, "withTransaction").mockRejectedValue(error);
};
