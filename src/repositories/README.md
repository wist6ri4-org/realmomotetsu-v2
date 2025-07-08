# Repository パターン実装ガイド

## 概要

このプロジェクトでは Repository パターンを採用し、データアクセス層とビジネスロジック層を分離しています。Prisma を使用したデータベース操作を適切に抽象化し、テストしやすく保守しやすいコード構造を実現しています。

## 📁 ディレクトリ構造

```
src/repositories/
├── base/
│   └── BaseRepository.ts              # 基底Repositoryクラス
├── events/
│   └── EventsRepository.ts            # イベント関連のデータアクセス
├── eventTypes/
│   └── EventTypesRepository.ts        # イベント種別関連のデータアクセス
├── stations/
│   └── StationsRepository.ts          # 駅関連のデータアクセス
├── nearbyStations/
│   └── NearbyStationsRepository.ts    # 近隣駅関連のデータアクセス
├── teams/
│   └── TeamsRepository.ts             # チーム関連のデータアクセス
├── goalStations/
│   └── GoalStationsRepository.ts      # 目的駅関連のデータアクセス
├── transitStations/
│   └── TransitStationsRepository.ts   # 経由駅関連のデータアクセス
├── bombiiHistories/
│   └── BombiiHistoriesRepository.ts   # ボンビー履歴関連のデータアクセス
└── RepositoryFactory.ts               # Repositoryファクトリ
```

## 🎯 主な機能

### 1. 基底 Repository クラス (BaseRepository)

-   **共通機能**: トランザクション処理、エラーハンドリング
-   **継承**: すべての Repository クラスがこれを継承
-   **Prisma クライアント**: 統一された Prisma クライアントの使用

### 2. RepositoryFactory

-   **シングルトンパターン**: Repository インスタンスの一元管理
-   **依存性注入**: Service クラスで簡単に Repository を取得
-   **メモリ効率**: 同じインスタンスを再利用

### 3. 型安全性

-   **カスタム型定義**: include 句を使用した場合の型を適切に定義
-   **TypeScript**: 完全な型安全性を保証

## 🚀 使用方法

### Repository 単体での使用

```typescript
import { RepositoryFactory } from "@/repositories/RepositoryFactory";

// イベント関連
const eventsRepository = RepositoryFactory.getEventsRepository();
const event = await eventsRepository.findByEventCode("EVENT001");
const eventWithRelations = await eventsRepository.findByEventCodeWithRelations("EVENT001");

// 駅関連
const stationsRepository = RepositoryFactory.getStationsRepository();
const stations = await stationsRepository.findByEventTypeCode("YAMANOTE");
const nearStations = await stationsRepository.searchByName("新宿");

// 近隣駅関連
const nearbyStationsRepository = RepositoryFactory.getNearbyStationsRepository();
const connections = await nearbyStationsRepository.findFromStation("SHINJUKU");
const reachableStations = await nearbyStationsRepository.findWithinTime("SHINJUKU", 30);

// チーム関連
const teamsRepository = RepositoryFactory.getTeamsRepository();
const teams = await teamsRepository.findByEventCode("EVENT001");

// 新しいチームを作成
const newTeam = await teamsRepository.create({
    teamCode: "TEAM001",
    teamName: "チーム1",
    teamColor: "#FF0000",
    eventCode: "EVENT001",
});
```

### Service での使用例

```typescript
import { RepositoryFactory } from "@/repositories/RepositoryFactory";

export const EventManagementService = {
    // イベント詳細情報の取得（複数Repository使用例）
    async getEventDetails(eventCode: string) {
        const eventsRepository = RepositoryFactory.getEventsRepository();
        const teamsRepository = RepositoryFactory.getTeamsRepository();
        const goalStationsRepository = RepositoryFactory.getGoalStationsRepository();
        const transitStationsRepository = RepositoryFactory.getTransitStationsRepository();

        // 並列でデータを取得
        const [event, teams, goalStations, transitStations] = await Promise.all([
            eventsRepository.findByEventCodeWithRelations(eventCode),
            teamsRepository.findByEventCode(eventCode),
            goalStationsRepository.findByEventCode(eventCode),
            transitStationsRepository.findByEventCode(eventCode),
        ]);

        return { event, teams, goalStations, transitStations };
    },

    // 駅間ルート検索の例
    async findRoute(fromStationCode: string, toStationCode: string) {
        const nearbyStationsRepository = RepositoryFactory.getNearbyStationsRepository();
        const stationsRepository = RepositoryFactory.getStationsRepository();

        // 直接接続をチェック
        const directRoute = await nearbyStationsRepository.findConnection(
            fromStationCode,
            toStationCode
        );
        if (directRoute) {
            return { route: [directRoute], totalTime: directRoute.timeMinutes };
        }

        // より複雑なルート検索
        const possibleRoutes = await nearbyStationsRepository.findShortestPath(
            fromStationCode,
            toStationCode
        );
        return {
            route: possibleRoutes,
            totalTime: possibleRoutes.reduce((sum, r) => sum + r.timeMinutes, 0),
        };
    },
};
```

### トランザクションの使用

```typescript
class CustomRepository extends BaseRepository {
    async complexOperation(data: any) {
        return await this.executeTransaction(async (tx) => {
            const team = await tx.teams.create({ data: teamData });
            const history = await tx.bombiiHistories.create({
                data: { teamCode: team.teamCode, eventCode: data.eventCode },
            });
            return { team, history };
        });
    }
}
```

## 🛠 新しい Repository の追加方法

### 1. Repository クラスの作成

```typescript
// src/repositories/newEntity/NewEntityRepository.ts
import { NewEntity } from "@/generated/prisma";
import { BaseRepository } from "../base/BaseRepository";

export class NewEntityRepository extends BaseRepository {
    async findById(id: number): Promise<NewEntity | null> {
        try {
            return await this.prisma.newEntity.findUnique({
                where: { id },
            });
        } catch (error) {
            this.handleDatabaseError(error, "findById");
        }
    }

    // その他のメソッドを実装
}
```

### 2. RepositoryFactory への追加

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

## 🧪 テスト

Repository パターンにより、Service のテストが容易になります：

```typescript
// テスト例
describe("MyService", () => {
    beforeEach(() => {
        // モックRepositoryをセットアップ
        jest.spyOn(RepositoryFactory, "getTeamsRepository").mockReturnValue(mockTeamsRepository);
    });

    it("should return data correctly", async () => {
        // テストロジック
    });
});
```

## 🎨 ベストプラクティス

1. **単一責任の原則**: 各 Repository は特定のエンティティのみを担当
2. **エラーハンドリング**: BaseRepository の共通エラーハンドリングを活用
3. **型安全性**: include 句を使用する場合は適切な型を定義
4. **トランザクション**: 複数のテーブルにまたがる操作ではトランザクションを使用
5. **命名規則**: メソッド名は明確で一貫性のある命名を使用

## 🔧 今後の拡張

-   **キャッシュ機能**: Redis 等を使用したキャッシュ層の追加
-   **ページネーション**: 大量データ取得時のページネーション機能
-   **監査ログ**: データ変更の監査ログ機能
-   **パフォーマンス監視**: クエリ実行時間の監視機能

## 高度な使用例

#### 地理的検索とデータ分析

```typescript
import { RepositoryFactory } from "@/repositories/RepositoryFactory";

export const AnalyticsService = {
    // 指定エリア内の駅とイベント分析
    async analyzeAreaEvents(centerLat: number, centerLng: number, radiusKm: number) {
        const stationsRepository = RepositoryFactory.getStationsRepository();
        const eventsRepository = RepositoryFactory.getEventsRepository();
        const transitStationsRepository = RepositoryFactory.getTransitStationsRepository();

        // エリア内の駅を取得
        const stationsInArea = await stationsRepository.findStationsInRadius(
            centerLat,
            centerLng,
            radiusKm,
            "YAMANOTE"
        );

        // 各駅でのイベント使用状況を分析
        const stationAnalysis = await Promise.all(
            stationsInArea.map(async (station) => {
                const transitCount = await transitStationsRepository.countEventsByStation(
                    station.stationCode
                );
                return {
                    station,
                    eventUsageCount: transitCount,
                    isMissionStation: station.isMissionSet,
                };
            })
        );

        return {
            totalStations: stationsInArea.length,
            missionStations: stationsInArea.filter((s) => s.isMissionSet).length,
            stationAnalysis,
        };
    },

    // チーム活動統計
    async getTeamStatistics(eventCode: string) {
        const teamsRepository = RepositoryFactory.getTeamsRepository();
        const bombiiHistoriesRepository = RepositoryFactory.getBombiiHistoriesRepository();

        const [teams, bombiiHistories] = await Promise.all([
            teamsRepository.findByEventCode(eventCode),
            bombiiHistoriesRepository.findByEventCode(eventCode),
        ]);

        // チーム別ボンビー回数を集計
        const teamBombiiCount = teams.map((team) => {
            const bombiiCount = bombiiHistories.filter((h) => h.teamCode === team.teamCode).length;
            return {
                team,
                bombiiCount,
                isCurrentBombii: bombiiHistories[0]?.teamCode === team.teamCode,
            };
        });

        return {
            totalTeams: teams.length,
            totalBombiiEvents: bombiiHistories.length,
            teamStatistics: teamBombiiCount,
        };
    },
};
```

#### バッチ処理とデータ管理

```typescript
export const DataManagementService = {
    // イベントの一括セットアップ
    async setupEvent(eventData: {
        eventCode: string;
        eventName: string;
        eventTypeCode: string;
        goalStationCodes: string[];
        transitStationCodes: string[];
        teamConfigs: Array<{
            teamCode: string;
            teamName: string;
            teamColor: string;
        }>;
    }) {
        const eventsRepository = RepositoryFactory.getEventsRepository();
        const teamsRepository = RepositoryFactory.getTeamsRepository();
        const goalStationsRepository = RepositoryFactory.getGoalStationsRepository();
        const transitStationsRepository = RepositoryFactory.getTransitStationsRepository();

        // トランザクション内で一括処理
        return await eventsRepository.executeTransaction(async (tx) => {
            // イベント作成
            const event = await tx.events.create({
                data: {
                    eventCode: eventData.eventCode,
                    eventName: eventData.eventName,
                    eventTypeCode: eventData.eventTypeCode,
                },
            });

            // チーム一括作成
            const teams = await Promise.all(
                eventData.teamConfigs.map((config) =>
                    tx.teams.create({
                        data: {
                            ...config,
                            eventCode: eventData.eventCode,
                        },
                    })
                )
            );

            // 目的駅一括作成
            await tx.goalStations.createMany({
                data: eventData.goalStationCodes.map((stationCode) => ({
                    stationCode,
                    eventCode: eventData.eventCode,
                })),
            });

            // 経由駅一括作成
            await tx.transitStations.createMany({
                data: eventData.transitStationCodes.map((stationCode) => ({
                    stationCode,
                    eventCode: eventData.eventCode,
                })),
            });

            return { event, teams };
        });
    },

    // データクリーンアップ
    async cleanupEvent(eventCode: string) {
        const eventsRepository = RepositoryFactory.getEventsRepository();
        const transitStationsRepository = RepositoryFactory.getTransitStationsRepository();
        const goalStationsRepository = RepositoryFactory.getGoalStationsRepository();

        // 関連データを順番に削除
        const transitDeleted = await transitStationsRepository.deleteAllByEvent(eventCode);
        // goalStationsやteamsの削除も同様に実装

        return {
            transitStationsDeleted: transitDeleted,
            // 他の削除結果も含める
        };
    },
};
```
