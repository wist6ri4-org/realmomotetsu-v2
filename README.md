# Real Momotetsu V2 基本仕様と開発環境のセットアップ
---
## 概要

このプロジェクトは、Next.js で構築された Web アプリケーションで、Prisma を ORM 、Supabase をバックエンドサービスとして利用している。

### ディレクトリ構成

```plaintext
├─data              DB用初期投入データ、SQLファイル
├─docs              ドキュメント
├─node_modules      【Git管理外】node.jsのモジュール
├─prisma            Prisma関連
|  ├─csv            シード用CSVファイル
│  └─migrations     データベースマイグレーション
├─public            静的ファイル（画像、フォントなど）
├─src               アプリケーションのソースコード
│  ├─app            Next.jsのアプリケーションディレクトリ、page.tsxによってルーティングされる
│  │  └─api         APIエンドポイント、route.tsによってルーティングされる
│  ├─components     再利用可能なUIコンポーネント
│  │  ├─base        基本的なUIコンポーネント（ボタン、入力フィールド、カードなど）
│  │  └─composites  複合的なUIコンポーネント（ヘッダー、フッター、フォームなど）
│  ├─constants      定数定義
│  ├─contexts       Reactコンテキストプロバイダー
│  ├─data           静的データ、モックデータ
│  │  └─routemap    路線図用設定ファイル
│  ├─features       機能ごとのサービス層、APIエンドポイントごとに特定の機能に関連するファイルを集約する
│  ├─generated      【Git管理外】Prismaクライアントの自動生成コード
│  ├─hooks          カスタムReactフック
│  ├─lib            ライブラリ設定（Prismaクライアント、Supabaseクライアントなど）
│  ├─repositories   データアクセス層
│  ├─styles         スタイル、テーマ設定（CSS、Sass、MUIテーマなど）
|  ├─templates      通知用テンプレート、通知メッセージのテンプレートを定義する
│  │  ├─discord     Discord通知テンプレート
│  │  └─email       メール通知テンプレート（Supabase Authentication）
│  ├─theme          テーマ設定、アプリケーションのテーマやスタイルを定義する
│  ├─types          TypeScriptの型定義
│  └─utils          ユーティリティ関数、共通して使用される関数やヘルパー
├─supabase          Supabaseの設定と一時ファイル
└─test              テスト関連
   └─http           HTTPリクエストのテスト
```

### アーキテクチャ概要図

```mermaid
graph TB
    subgraph "ユーザー"
        U[ユーザー]
    end
    subgraph "フロントエンド層"
        A[React Components<br/>src/app/]
        B[UI Components<br/>src/components/]
        C[Custom Hooks<br/>src/hooks/]
    end

    subgraph "API層"
        D[API Endpoints<br/>src/app/api/]
        E[API Handlers<br/>*ApiHandler.ts]
    end

    subgraph "サービス層"
        F[Business Logic<br/>src/features/]
        G[Utils<br/>src/utils/]
    end

    subgraph "データアクセス層"
        H[Repositories<br/>src/repositories/]
        I[Prisma Client<br/>src/lib/prisma.ts]
    end

    subgraph "データベース"
        J[Supabase PostgreSQL]
    end

    subgraph "認証・外部サービス"
        K[Supabase Auth]
        L[Discord API]
    end

    U --アクセス--> A
    A --> D
    B -.使用.-> A
    C -.使用.-> A
    D --> E
    E --> F
    F --> H
    G -.-> F
    H --> I
    I --> J
    F --> K
    F --> L

    classDef frontend fill:#e1f5fe
    classDef api fill:#f3e5f5
    classDef service fill:#e8f5e8
    classDef data fill:#fff3e0
    classDef database fill:#ffebee
    classDef external fill:#f1f8e9

    class A,B,C frontend
    class D,E api
    class F,G service
    class H,I data
    class J database
    class K,L external
```

### 処理概要

1. ユーザーがフロントエンド（`src/app/`）で操作を行う。
2. フロントエンドは API エンドポイント（`src/app/api/`）にリクエストを送信する。
3. API エンドポイントはサービス層（`src/features/`）を呼び出し、ビジネスロジックを実行する。
4. サービス層はリポジトリ（`src/repositories/`）を使用してデータベースにアクセスする。
5. リポジトリは Prisma を使用してデータベース操作を行う。

-   **フロントエンド**: ユーザーインターフェースを提供し、ユーザーの操作を受け付ける。React コンポーネントを使用して構築されている。
-   **API エンドポイント**: フロントエンドからのリクエストを受け取り、適切なサービス層のメソッドを呼び出す。`src/app/api/`ディレクトリに配置されている。
-   **サービス層**: ビジネスロジックを実装し、API エンドポイントからのリクエストを処理する。特定の機能に関連する処理を集約している。`src/features/`ディレクトリに配置されている。
-   **リポジトリ**: データベースとのやり取りを担当する。Prisma を使用してデータベース操作を行う。`src/repositories/`ディレクトリに配置されている。
-   **Prisma**: ORM ツールとして使用され、データベースとのやり取りを簡素化する。スキーマ定義、マイグレーション、クエリの実行などを行う。
-   **Supabase**: バックエンドサービスとして使用され、リアルタイムデータベース、認証、ストレージなどの機能を提供する。ユーザー認証やデータの保存に利用される。

### 処理詳細例

#### init-home

ホーム画面の初期データを取得・表示する処理フロー

##### 処理フロー図
```mermaid
sequenceDiagram
    participant User as ユーザー
    participant Frontend as フロントエンド<br/>(React Component)
    participant API as APIエンドポイント<br/>(/api/init-home)
    participant Handler as APIハンドラー<br/>(InitHomeApiHandler)
    participant Service as サービス層<br/>(InitHomeService)
    participant Repos as 各種リポジトリ
    participant DB as データベース<br/>(Prisma + Supabase)

    User->>Frontend: ページアクセス
    Frontend->>Frontend: useEffect実行
    Frontend->>API: GET /api/init-home?eventCode=xxx

    API->>Handler: リクエスト委譲
    Handler->>Handler: クエリパラメータ取得
    Handler->>Handler: Zodバリデーション<br>（リクエストが正しい形式か確認）
    Handler->>Service: getDataForHome(validatedParams)

    Service->>Repos: 並列データ取得開始

    par 並列処理
        Service->>Repos: teamsRepository.findByEventCode()
        Repos->>DB: チーム情報取得
        DB-->>Repos: Teams[]
        Repos-->>Service: Teams[]
    and
        Service->>Repos: goalStationsRepository.findNextGoalStation()
        Repos->>DB: 次ゴール駅取得
        DB-->>Repos: GoalStation
        Repos-->>Service: GoalStation
    and
        Service->>Repos: bombiiHistoriesRepository.findCurrentBombiiTeam()
        Repos->>DB: ボンビー保持チーム取得
        DB-->>Repos: BombiiHistory
        Repos-->>Service: BombiiHistory
    and
        Service->>Repos: pointsRepository.sumPointsGroupedByTeamCode()
        Repos->>DB: チーム別ポイント合計取得
        DB-->>Repos: PointsSummary[]
        Repos-->>Service: PointsSummary[]
    and
        Service->>Repos: その他のデータ取得
        Repos->>DB: 各種データ取得
        DB-->>Repos: 各種データ
        Repos-->>Service: 各種データ
    end

    Service->>Service: 駅グラフ構築
    Service->>Service: ダイクストラ法で残り駅数計算
    Service->>Service: TeamDataへの変換・統合<br>レスポンスの形式に変換
    Service-->>Handler: InitHomeResponse

    Handler->>Handler: レスポンス作成
    Handler-->>API: NextResponse
    API-->>Frontend: JSON Response

    Frontend->>Frontend: 状態更新
    Frontend->>Frontend: UI描画
    Frontend-->>User: ホーム画面表示
```

##### 詳細な処理ステップ
**1. フロントエンド処理 (`src/app/events/[eventCode]/home/page.tsx`)**

-   ページの初期表示時に `useEffect` で `fetchData()` を実行
-   `eventCode` パラメータを含むクエリパラメータを作成
-   `/api/init-home` エンドポイントに GET リクエストを送信
-   レスポンスデータを状態管理し、コンポーネントに反映
-   エラー・ローディング状態も適切にハンドリング

```typescript
// データの取得処理
const fetchData = async () => {
    try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams();
        params.append("eventCode", eventCode as string);

        const response = await fetch("/api/init-home?" + params.toString());
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const teamData = data?.data?.teamData || data?.teamData || [];
        // ... データの設定処理
        setTeamData(teamData as TeamData[]);
        setNextGoalStationData(nextGoalStationData as GoalStationsWithRelations);
        setBombiiTeamData(bombiiTeamData as Teams);
    } catch (error) {
        console.error("Error fetching data:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
        setIsLoading(false);
    }
};
```

**2. API エンドポイント (`src/app/api/init-home/route.ts`)**

-   `createApiHandler` を使用して `InitHomeApiHandler` クラスにリクエストを委譲

```typescript
import { createApiHandler } from "@/app/api/utils/apiHandler";
import InitHomeApiHandler from "./InitHomeApiHandler";

export const GET = createApiHandler(InitHomeApiHandler);
```

**3. API ハンドラー (`src/app/api/init-home/InitHomeApiHandler.ts`)**

-   クエリパラメータから `eventCode` を取得
-   Zod スキーマ (`initHomeRequestSchema`) でバリデーション実行
-   `InitHomeServiceImpl.getDataForHome()` を呼び出してビジネスロジックを処理
-   正常レスポンスまたはエラーレスポンスを返却

```typescript
private async handleGet(req: NextRequest): Promise<NextResponse> {
    this.logInfo("Handling GET request for init-home");

    try {
        // クエリパラメータを取得
        const { searchParams } = new URL(req.url);
        const queryParams = Object.fromEntries(searchParams.entries());

        // Zodでバリデーション
        const validatedParams = initHomeRequestSchema.parse(queryParams);

        // サービスからデータを取得
        const data: InitHomeResponse = await InitHomeServiceImpl.getDataForHome(
            validatedParams
        );

        return this.createSuccessResponse(data);
    } catch (error) {
        return this.handleError(error);
    }
}
```

**4. サービス層 (`src/features/init-home/service.ts`)**
以下のデータを並列取得してホーム画面に必要な情報を組み立て：

-   チーム情報 (`teamsRepository.findByEventCode`)
-   次のゴール駅 (`goalStationsRepository.findNextGoalStation`)
-   現在のボンビー保持チーム (`bombiiHistoriesRepository.findCurrentBombiiTeam`)
-   チーム別ポイント合計 (`pointsRepository.sumPointsGroupedByTeamCode`)
-   チーム別得点済みポイント合計 (`pointsRepository.sumScoredPointsGroupedByTeamCode`)
-   イベント情報 (`eventsRepository.findByEventCode`)
-   チーム別ボンビー回数 (`bombiiHistoriesRepository.countByEventCodeGroupedByTeamCode`)
-   駅グラフ情報を取得し、ダイクストラ法で残り駅数を計算

```typescript
async getDataForHome(req: InitHomeRequest): Promise<InitHomeResponse> {
    // リポジトリの取得
    const teamsRepository = RepositoryFactory.getTeamsRepository();
    const goalStationsRepository = RepositoryFactory.getGoalStationsRepository();
    // ... 他のリポジトリ

    try {
        // 並列でデータを取得
        const [
            teams,
            nextGoalStation,
            currentBombiiHistory,
            totalPoints,
            totalScoredPoints,
            events,
            bombiiCounts,
        ] = await Promise.all([
            teamsRepository.findByEventCode(req.eventCode),
            goalStationsRepository.findNextGoalStation(req.eventCode),
            bombiiHistoriesRepository.findCurrentBombiiTeam(req.eventCode),
            pointsRepository.sumPointsGroupedByTeamCode(req.eventCode),
            pointsRepository.sumScoredPointsGroupedByTeamCode(req.eventCode),
            eventsRepository.findByEventCode(req.eventCode),
            bombiiHistoriesRepository.countByEventCodeGroupedByTeamCode(req.eventCode),
        ]);

        // 駅グラフの構築
        const eventTypeCode = events?.eventTypeCode || "";
        const stationGraph = await nearbyStationsRepository.findByEventTypeCode(eventTypeCode);
        const convertedStationGraph = DijkstraUtils.convertToStationGraph(stationGraph);

        // TeamsをTeamDataに変換
        const teamData: TeamData[] = teams.map((team) => ({
            id: team.id,
            teamCode: team.teamCode,
            teamName: team.teamName,
            teamColor: team.teamColor || "",
            transitStations: team.transitStations,
            remainingStationsNumber: DijkstraUtils.calculateRemainingStationsNumber(
                convertedStationGraph,
                team.transitStations.at(-1)?.stationCode || "",
                nextGoalStation?.stationCode || ""
            ),
            points: totalPoints.find((p) => p.teamCode === team.teamCode)?.totalPoints || 0,
            scoredPoints: totalScoredPoints.find((p) => p.teamCode === team.teamCode)?.totalPoints || 0,
            bombiiCounts: bombiiCounts.find((b) => b.teamCode === team.teamCode)?.count || 0,
        }));

        return {
            teamData: teamData,
            nextGoalStation: nextGoalStation,
            bombiiTeam: bombiiTeam,
        };
    } catch (error) {
        console.error("Error in getDataForHome:", error);
        throw new Error("Failed to retrieve init home data");
    }
}
```

**5. データ加工・統合処理**

-   各チームのデータを `TeamData` 型に変換
-   ダイクストラ法を使用して各チームのゴールまでの残り駅数を計算
-   ポイント情報、ボンビー回数などを各チームに統合
-   現在のボンビー保持チームの情報を抽出

**6. レスポンス構成**

```typescript
// InitHomeResponse型定義
export type InitHomeResponse = {
    teamData: TeamData[]; // チーム一覧とその詳細データ
    nextGoalStation: GoalStations | null; // 次のゴール駅情報
    bombiiTeam: Teams | null; // 現在のボンビー保持チーム
};

// TeamData型定義
export type TeamData = {
    id: number;
    teamCode: string;
    teamName: string;
    teamColor: string;
    transitStations: TransitStationsWithRelations[];
    remainingStationsNumber: number; // ゴールまでの残り駅数
    points: number; // 累計ポイント
    scoredPoints: number; // 得点済みポイント
    bombiiCounts: number; // ボンビー回数
};
```

**7. フロントエンド表示**

-   `BulletinBoard` コンポーネントに次のゴール駅情報を表示
-   `TeamCard` コンポーネントのグリッドで各チームの状況を表示
-   更新ボタンで手動リフレッシュが可能
-   リアルタイムでローディング・エラー状態を表示

```tsx
return (
    <>
        {/* サブヘッダーセクション */}
        <Box>
            <BulletinBoard
                nextStation={nextGoalStationData.station?.name || "ー"}
                nextStationEng={nextGoalStationData.station?.stationCode || "ー"}
            />
            <CustomButton onClick={fetchData}>更新</CustomButton>
        </Box>

        {/* コンテンツセクション */}
        <Box>
            {/* ローディング表示 */}
            {isLoading && (
                <Box sx={{ textAlign: "center", mb: 4 }}>
                    <CircularProgress size={40} color="primary" />
                </Box>
            )}

            {/* エラー表示 */}
            {error && (
                <Alert
                    severity="error"
                    action={<CustomButton onClick={fetchData}>再試行</CustomButton>}
                >
                    {error}
                </Alert>
            )}

            {/* チームデータのグリッド表示 */}
            {!isLoading && !error && (
                <Grid container spacing={2}>
                    {teamData.map((teamData) => (
                        <Grid key={teamData.id} size={{ xs: 6, sm: 6, md: 3, lg: 3 }}>
                            <TeamCard teamData={teamData} bombiiTeamData={bombiiTeamData} />
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    </>
);
```

**バリデーション**
リクエストパラメータは Zod スキーマでバリデーションされる：

```typescript
// src/features/init-home/validator.ts
export const initHomeRequestSchema = z.object({
    eventCode: z.string().min(1, "Event code is required"),
});
```

## 開発環境のセットアップ

1. **Node.js と Docker のインストール**: Node.js と Docker をインストールする。
2. **依存関係のインストール**: プロジェクトディレクトリ（`/realmomotetsu-v2/`）で以下のコマンドを実行。
    ```bash
    npm install
    # または
    yarn install
    # または
    pnpm install
    # または
    bun install
    ```
3. **環境変数の設定**: `.env`ファイルを作成し、必要な環境変数を設定する（別途連携）。
    ※ルートディレクトリ直下（/realmomotetsu-v2/）に作成する。
    例:
    ```yaml
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
    NEXT_PUBLIC_API_URL=http://localhost:3000/api
    ```
    作成するのは以下の３ファイル
    - .env      ： 環境共通
    - .env.prod ： 本番環境用
    - .env.local： 開発環境用

4. **データベースのセットアップ**: Supabase と Prisma を使用してデータベースをセットアップする。
    ### Supabase のプロジェクトの作成
    1. Supabase のプロジェクトを作成し、データベースの接続情報を取得する。
    ```bash
    npx supabase init
    npx supabase start
    ```
    2. `prisma/schema.prisma` ファイルを編集して、データベースのモデルを定義する。
    3. Prisma マイグレーションを実行して、データベースを初期化する。
    ```bash
    npx prisma migrate dev --name init

    # .env.localの環境変数を使用してマイグレーションを実行する場合
    npx dotenv -e .env.local -- npx prisma migrate dev --name init
    ```
    これにより、データベースが初期化され、必要なテーブルが作成される。
5. **ビューの作成**: 必要なビューを作成する。supabase 起動後、supabase の SQL エディタで以下の SQL を実行。
   /supabase/sql/views.sql

    これによりビューが作成される。

6. **シードスクリプトの実行**: 初期データを挿入するためにシードスクリプトを実行。
    ```bash
    npm run seed
    ```
7. **開発サーバーの起動**: 以下のコマンドで開発サーバーを起動。
    ```bash
    npm run dev
    # または
    yarn dev
    # または
    pnpm dev
    # または
    bun dev
    ```
8. **DB の変更を反映**: 【Prisma スキーマを変更した場合】マイグレーションを再実行する。
    ```bash
    # 開発環境用
    npx prisma migrate dev --name <migration_name>
    ```

## Prisma の使用方法

Prisma は ORM（Object-Relational Mapping）ツールで、データベースとのやり取りを簡素化する。以下は Prisma の基本的な使用方法。

### Prisma のセットアップ

1. **Prisma のインストール**: プロジェクトに Prisma を追加します。
    ※ `npm install`等を実行して、既にインストールされている場合は不要。
    ```bash
    npm install prisma --save-dev
    npx prisma init
    ```
2. **スキーマの定義**: `prisma/schema.prisma` ファイルを編集して、データベースのモデルやビューを定義する。例えば、以下のようにユーザーモデル、ビューを定義できる。

    ```prisma
    model User {
      id        Int      @id @default(autoincrement())
      name      String
      email     String   @unique
      createdAt DateTime @default(now())
    }

    view UserView {
      id        Int
      name      String
      email     String
      createdAt DateTime
    }
    ```

3. **マイグレーションの実行**: スキーマをデータベースに適用するためにマイグレーションを実行します。
    ```bash
    # 開発環境用
    npx prisma migrate dev --name <migration_name>
    ```
4. **クライアントの生成**: Prisma クライアントを生成します。（現状では npm run dev で自動的に実行される）
    ```bash
    npx prisma generate
    ```

### Prisma クライアントの使用

Prisma クライアントを使用してデータベースにアクセスする。以下は基本的な CRUD 操作の例。

#### データの取得

```typescript
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function getUsers() {
    const users = await prisma.user.findMany();
    return users;
}
```

#### データの作成

```typescript
async function createUser(name: string, email: string) {
    const user = await prisma.user.create({
        data: {
            name,
            email,
        },
    });
    return user;
}
```

#### データの更新

```typescript
async function updateUser(id: number, name: string) {
    const user = await prisma.user.update({
        where: { id },
        data: { name },
    });
    return user;
}
```

#### データの削除

```typescript
async function deleteUser(id: number) {
    const user = await prisma.user.delete({
        where: { id },
    });
    return user;
}
```

## Supabase の使用方法

Supabase はオープンソースの Firebase 代替で、リアルタイムデータベース、認証、ストレージなどの機能を提供している。以下は Supabase の基本的な使用方法。

### Supabase のセットアップ（本番環境）

1. **Supabase のプロジェクト作成**: Supabase のウェブサイトで新しいプロジェクトを作成する。
2. **API キーの取得**: プロジェクトの設定から API キーを取得する。
3. **Supabase クライアントのインストール**: プロジェクトに Supabase クライアントを追加する。
    ```bash
    npm install @supabase/supabase-js
    ```
4. **Supabase クライアントの初期化**: アプリケーションのエントリポイントで Supabase クライアントを初期化する。

    ```typescript
    import { createClient } from "@supabase/supabase-js";

    const supabaseUrl = "https://your-project.supabase.co";
    const supabaseKey = "your-anon-key";
    const supabase = createClient(supabaseUrl, supabaseKey);
    ```

### Supabase の使用（参考）

Supabase を使用してデータベースにアクセスする。以下は基本的な CRUD 操作の例。
<span style="color: red">本プロジェクトでは Prisma を使用するため、Supabase SDK はユーザー認証にのみ使用。</span>

#### データの取得

```typescript
async function getUsers() {
    const { data, error } = await supabase.from("users").select("*");
    if (error) {
        console.error("Error fetching users:", error);
        return [];
    }
    return data;
}
```

#### データの作成

```typescript
async function createUser(name: string, email: string) {
    const { data, error } = await supabase.from("users").insert([{ name, email }]);
    if (error) {
        console.error("Error creating user:", error);
        return null;
    }
    return data[0];
}
```

#### データの更新

```typescript
async function updateUser(id: number, name: string) {
    const { data, error } = await supabase.from("users").update({ name }).eq("id", id);
    if (error) {
        console.error("Error updating user:", error);
        return null;
    }
    return data[0];
}
```

#### データの削除

```typescript
async function deleteUser(id: number) {
    const { data, error } = await supabase.from("users").delete().eq("id", id);
    if (error) {
        console.error("Error deleting user:", error);
        return null;
    }
    return data[0];
}
```

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
他のポートで起動したい場合、package.json の`dev`スクリプトを変更する。
例えば、`"dev": "next dev --turbopack -p 3001"`のように、`-p`オプションでポート番号を指定できる。
現在は[http://localhost:3001](http://localhost:3001)を使用中。

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
