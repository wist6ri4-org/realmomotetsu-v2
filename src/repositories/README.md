# Repository パターン実装ガイド

## 概要

このプロジェクトでは Repository パターンを採用し、データアクセス層とビジネスロジック層を分離している。Prisma を使用したデータベース操作を適切に抽象化し、テストしやすく保守しやすいコード構造を実現している。

## ディレクトリ構造

```
src/repositories/
├── attendances/
│   └── AttendancesRepository.ts         # イベント参加関連のデータアクセス
├── base/
│   └── BaseRepository.ts                # 基底 Repository クラス
├── bombiiHistories/
│   └── BombiiHistoriesRepository.ts     # ボンビー履歴関連のデータアクセス
├── documents/
│   └── DocumentsRepository.ts           # ドキュメント関連のデータアクセス
├── events/
│   └── EventsRepository.ts              # イベント関連のデータアクセス
├── eventTypes/
│   └── EventTypesRepository.ts          # イベント種別関連のデータアクセス
├── goalStations/
│   └── GoalStationsRepository.ts        # ゴール駅関連のデータアクセス
├── nearbyStations/
│   └── NearbyStationsRepository.ts      # 近隣駅関連のデータアクセス
├── points/
│   └── PointsRepository.ts              # ポイント関連のデータアクセス
├── propertyPurchases/
│   └── PropertyPurchasesRepository.ts   # 物件購入関連のデータアクセス
├── stations/
│   └── StationsRepository.ts            # 駅関連のデータアクセス
├── teams/
│   └── TeamsRepository.ts               # チーム関連のデータアクセス
├── transitStations/
│   └── TransitStationsRepository.ts     # 経由駅関連のデータアクセス
├── users/
│   └── UsersRepository.ts               # ユーザー関連のデータアクセス
└── RepositoryFactory.ts                 # Repository ファクトリ（シングルトン管理）
```

## 主な仕組み

### BaseRepository

すべての Repository クラスが継承する基底クラス。

- **`executeTransaction(operations)`**: Prisma トランザクションのラッパー
- **`handleDatabaseError(error, operation)`**: 共通エラーハンドリング（Unique / Foreign key 制約違反を適切な例外に変換）

### RepositoryFactory

Repository インスタンスをシングルトンとして管理するファクトリクラス。

- **`RepositoryFactory.get*Repository()`**: 各 Repository のシングルトンインスタンスを取得
- **`RepositoryFactory.withTransaction(operations)`**: 複数の Repository をまたぐトランザクションを実行

## 使用方法

### Service での基本的な使い方

```typescript
import { RepositoryFactory } from "@/repositories/RepositoryFactory";

// 単一の Repository を使う
const teamsRepository = RepositoryFactory.getTeamsRepository();
const teams = await teamsRepository.findByEventCode("EVENT001");

// 複数の Repository を並列取得
const eventsRepository = RepositoryFactory.getEventsRepository();
const goalStationsRepository = RepositoryFactory.getGoalStationsRepository();

const [event, goalStations] = await Promise.all([
    eventsRepository.findByEventCode("EVENT001"),
    goalStationsRepository.findByEventCode("EVENT001"),
]);
```

### トランザクションの使い方

```typescript
// RepositoryFactory.withTransaction で複数テーブルをアトミックに操作
await RepositoryFactory.withTransaction(async (tx) => {
    await tx.teams.create({ data: teamData });
    await tx.bombiiHistories.create({ data: historyData });
});

// Repository クラス内では executeTransaction を使用
class MyRepository extends BaseRepository {
    async complexOperation(data: SomeType) {
        return await this.executeTransaction(async (tx) => {
            const created = await tx.someModel.create({ data });
            await tx.otherModel.update({ where: { id: created.id }, data: { ... } });
            return created;
        });
    }
}
```

### 型定義のパターン

`include` 句を使用する場合は、Repository ファイル内でカスタム型を定義する。

```typescript
// リレーションを含む型
export type PropertyPurchasesWithRelations = PropertyPurchases & {
    event: Events;
    team: Teams;
    station: Stations;
};

// select を使った部分型
export type PropertyPurchasesForRoutemap = {
    stationCode: string;
    team: { teamColor: string | null };
};
```

## 新しい Repository の追加手順

### 1. Repository クラスを作成する

```typescript
// src/repositories/newEntity/NewEntityRepository.ts
import { NewEntity } from "@/generated/prisma";
import { BaseRepository } from "../base/BaseRepository";

export class NewEntityRepository extends BaseRepository {
    async findById(id: number): Promise<NewEntity | null> {
        try {
            return await this.prisma.newEntity.findUnique({ where: { id } });
        } catch (error) {
            this.handleDatabaseError(error, this.findById.name);
        }
    }
}
```

### 2. RepositoryFactory に追加する

```typescript
// src/repositories/RepositoryFactory.ts
import { NewEntityRepository } from "./newEntity/NewEntityRepository";

export class RepositoryFactory {
    private static newEntityRepository: NewEntityRepository | null = null;

    static getNewEntityRepository(): NewEntityRepository {
        if (!this.newEntityRepository) {
            this.newEntityRepository = new NewEntityRepository(prisma);
        }
        return this.newEntityRepository;
    }
}
```

## テスト

Repository パターンにより、Service のユニットテストが容易になる。

```typescript
describe("MyService", () => {
    beforeEach(() => {
        jest.spyOn(RepositoryFactory, "getTeamsRepository").mockReturnValue(mockTeamsRepository);
    });

    it("should return team data", async () => {
        const result = await MyService.getTeams("EVENT001");
        expect(result).toEqual(expectedData);
    });
});
```

## ベストプラクティス

- 各 Repository は特定のエンティティのみを担当する（単一責任の原則）
- `handleDatabaseError` を使って共通エラーハンドリングを活用する
- リレーションを含む場合は適切な型を定義する
- 複数テーブルにまたがる操作ではトランザクションを使用する
- メソッド名は `findBy*`、`create`、`update`、`delete*` など一貫した命名を使用する
