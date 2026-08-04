# Real Momotetsu V2 基本仕様と開発環境のセットアップ

---

## 概要

このプロジェクトは、Next.js で構築された Web アプリケーションで、Prisma を ORM 、Supabase をバックエンドサービスとして利用している。

### ディレクトリ構成

```plaintext
├─__tests__         ユニットテスト
│  ├─error          エラーハンドリングのテスト
│  └─output         テスト出力ファイル
├─data              DB用初期投入データ、SQLファイル
├─docs              ドキュメント
├─node_modules      【Git管理外】node.jsのモジュール
├─prisma            Prisma関連
|  ├─csv            シード用CSVファイル
│  └─migrations     データベースマイグレーション
├─public            静的ファイル（画像、フォントなど）
├─scripts           スクリプト（路線図設定ファイルの生成など）
├─src               アプリケーションのソースコード
│  ├─app            Next.jsのアプリケーションディレクトリ、page.tsxによってルーティングされる
│  │  ├─api         APIエンドポイント、route.tsによってルーティングされる
│  │  ├─events      イベント画面（v02/、v03/ のバージョン別ルーティング）
│  │  └─user        ユーザー認証関連ページ（サインイン、サインアップ、パスワード変更など）
│  ├─components     再利用可能なUIコンポーネント
│  │  ├─base        基本的なUIコンポーネント（ボタン、入力フィールド、カードなど）
│  │  └─composite   複合的なUIコンポーネント（ヘッダー、フッター、フォームなど）
│  ├─constants      定数定義
│  ├─contexts       Reactコンテキストプロバイダー
│  ├─data           静的データ
│  │  └─routemap    路線図用設定ファイル（JSON）
│  ├─error          エラークラス定義（ApiError、ApplicationError）
│  ├─features       機能ごとのサービス層、APIエンドポイントごとに特定の機能に関連するファイルを集約する
│  ├─generated      【Git管理外】Prismaクライアントの自動生成コード
│  ├─hooks          カスタムReactフック
│  ├─lib            ライブラリ設定（Prismaクライアント、Supabaseクライアントなど）
│  ├─repositories   データアクセス層
│  ├─styles         スタイル、テーマ設定（CSS、MUIテーマなど）
|  ├─templates      通知用テンプレート、通知メッセージのテンプレートを定義する
│  │  ├─discord     Discord通知テンプレート
│  │  └─email       メール通知テンプレート（Supabase Authentication）
│  ├─theme          テーマ設定、アプリケーションのテーマやスタイルを定義する
│  ├─types          TypeScriptの型定義
│  └─utils          ユーティリティ関数、共通して使用される関数やヘルパー
├─supabase          Supabaseの設定と一時ファイル
│  └─sql            SQL スクリプト（ビュー作成、ストレージポリシーなど）
├─test              テスト関連
│  └─http           HTTPリクエストのテスト
└─tools             開発補助ツール
   ├─roulette-probability-analyzer  ルーレット確率分析ツール
   ├─routemap-checker               路線図整合性チェックツール
   └─station-distance-calculator    駅間距離計算ツール
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

- **フロントエンド**: ユーザーインターフェースを提供し、ユーザーの操作を受け付ける。React コンポーネントを使用して構築されている。
- **API エンドポイント**: フロントエンドからのリクエストを受け取り、適切なサービス層のメソッドを呼び出す。`src/app/api/`ディレクトリに配置されている。詳細は [src/app/api/README.md](src/app/api/README.md) を参照。
- **サービス層**: ビジネスロジックを実装し、API エンドポイントからのリクエストを処理する。特定の機能に関連する処理を集約している。`src/features/`ディレクトリに配置されている。
- **リポジトリ**: データベースとのやり取りを担当する。Prisma を使用してデータベース操作を行う。`src/repositories/`ディレクトリに配置されている。詳細は [src/repositories/README.md](src/repositories/README.md) を参照。
- **Prisma**: ORM ツールとして使用され、データベースとのやり取りを簡素化する。スキーマ定義、マイグレーション、クエリの実行などを行う。
- **Supabase**: バックエンドサービスとして使用され、リアルタイムデータベース、認証、ストレージなどの機能を提供する。ユーザー認証やデータの保存に利用される。

### 主な機能

| 機能             | 概要                                                                             |
| ---------------- | -------------------------------------------------------------------------------- |
| ユーザー認証     | Supabase Auth を利用したサインイン・サインアップ・パスワード変更                 |
| イベント管理     | イベントの作成・管理。イベント種別（EventTypes）によって路線図や駅情報を切り替え |
| チーム管理       | イベントに参加するチームの管理                                                   |
| ルーレット       | ダイクストラ法による距離ベースの重み付きルーレットで次の目的駅を選択（V2）       |
| 目的駅管理       | ゴール駅の登録・到着処理                                                         |
| 経由駅管理       | 各チームの移動履歴の記録                                                         |
| ボンビー管理     | ボンビー履歴の記録・表示                                                         |
| ポイント管理     | チーム別の収益・支出の記録                                                       |
| 物件購入         | 駅での物件購入の記録                                                             |
| 路線図表示       | SVG ベースのインタラクティブな路線図表示（ズーム・パン対応）                     |
| Discord 通知     | ゲームイベント発生時の Discord Webhook 通知                                      |
| ドキュメント管理 | イベント関連ドキュメントの管理                                                   |

### API 設計パターン

API エンドポイントは `BaseApiHandler` を継承したハンドラークラスで実装する。

```
/api/<endpoint>/
├── route.ts              # Next.js ルートエントリポイント（createApiHandler でハンドラーを登録）
├── <Name>ApiHandler.ts   # リクエスト受付・バリデーション・レスポンス生成
└── （features/ 配下のサービス層を呼び出す）
```

詳細は [src/app/api/README.md](src/app/api/README.md) を参照。

**エンドポイント一覧**

| エンドポイント                 | 概要                           |
| ------------------------------ | ------------------------------ |
| `/api/init`                    | イベント情報の初期取得         |
| `/api/init-home`               | ホーム画面の初期データ取得     |
| `/api/init-form`               | 操作フォームの初期データ取得   |
| `/api/init-operation`          | 操作画面の初期データ取得       |
| `/api/init-roulette`           | ルーレット画面の初期データ取得 |
| `/api/init-routemap`           | 路線図画面の初期データ取得     |
| `/api/transit-stations`        | 経由駅の登録                   |
| `/api/goal-stations`           | ゴール駅の登録                 |
| `/api/arrival-goal-station-v3` | ゴール到着処理（V3）           |
| `/api/current-location`        | 現在地の更新                   |
| `/api/current-location-v3`     | 現在地の更新（V3）             |
| `/api/bombii-histories`        | ボンビー履歴の登録             |
| `/api/points`                  | ポイントの登録                 |
| `/api/property-purchases`      | 物件購入の登録                 |
| `/api/events`                  | イベント情報の取得・更新       |
| `/api/documents`               | ドキュメントの取得             |
| `/api/discord`                 | Discord 通知の送信             |
| `/api/users`                   | ユーザー情報の取得・更新       |
| `/api/verify`                  | 各種検証処理                   |

## 開発環境のセットアップ

1. **Node.js と Docker のインストール**: Node.js と Docker Desktop をインストールする。

    ```bash
    # Node.js のインストール（例: nvmを使用）
    nvm install 22.17.0
    nvm use 22.17.0
    node -v  # バージョン確認
    ```

2. **依存関係のインストール**: プロジェクトディレクトリ（`/realmomotetsu-v2/`）で以下のコマンドを実行。

    ```bash
    npm install
    ```

3. **データベースのセットアップ**: Supabase と Prisma を使用してデータベースをセットアップする。

    ### Supabase のローカル起動

    ```bash
    # Supabaseの初期化。supabase/config.tomlがあれば不要（通常不要）。
    npx supabase init

    # Supabaseの起動。Docker Desktopを事前に起動しておく。
    npx supabase start
    ```

    以下のような結果が表示されれば開発環境のSupabaseの起動は成功。
    Authentication KeysのPublishableは後で.env.localに設定するので控えておく。

    ```bash
    Started supabase local development setup.

    ╭──────────────────────────────────────╮
    │ 🔧 Development Tools                 │
    ├─────────┬────────────────────────────┤
    │ Studio  │ http://127.0.0.1:54323     │
    │ Mailpit │ http://127.0.0.1:54324     │
    │ MCP     │ http://127.0.0.1:54321/mcp │
    ╰─────────┴────────────────────────────╯

    ╭──────────────────────────────────────────────────────╮
    │ 🌐 APIs                                              │
    ├────────────────┬─────────────────────────────────────┤
    │ Project URL    │ http://127.0.0.1:54321              │
    │ REST           │ http://127.0.0.1:54321/rest/v1      │
    │ GraphQL        │ http://127.0.0.1:54321/graphql/v1   │
    │ Edge Functions │ http://127.0.0.1:54321/functions/v1 │
    ╰────────────────┴─────────────────────────────────────╯

    ╭───────────────────────────────────────────────────────────────╮
    │ ⛁ Database                                                    │
    ├─────┬─────────────────────────────────────────────────────────┤
    │ URL │ postgresql://postgres:postgres@127.0.0.1:54322/postgres │
    ╰─────┴─────────────────────────────────────────────────────────╯

    ╭──────────────────────────────────────────────────────────────╮
    │ 🔑 Authentication Keys                                       │
    ├─────────────┬────────────────────────────────────────────────┤
    │ Publishable │ sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH │
    │ Secret      │ sb_secret_XXXXXXXXXXXX-XXXXXXXX_XXXXXXXXX      │
    ╰─────────────┴────────────────────────────────────────────────╯

    ╭───────────────────────────────────────────────────────────────────────────────╮
    │ 📦 Storage (S3)                                                               │
    ├────────────┬──────────────────────────────────────────────────────────────────┤
    │ URL        │ http://127.0.0.1:54321/storage/v1/s3                             │
    │ Access Key │ 00000000000000000000000000000000                                 │
    │ Secret Key │ 0000000000000000000000000000000000000000000000000000000000000000 │
    │ Region     │ local                                                            │
    ╰────────────┴──────────────────────────────────────────────────────────────────╯
    ```

    ### .env.local の設定

    `.env.local` に以下を設定する。
    Published Keyを控え忘れた場合、`npx supabase status` コマンドで確認可能。

    ```env
    # Environment
    NODE_ENV=development

    # Base URL of the application
    NEXT_PUBLIC_BASE_URL=http://localhost:3000

    # Supabase Configuration
    NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
    NEXT_PUBLIC_SUPABASE_PUBLISHED_KEY=[控えたSupabaseのpublished key]

    # Connect to Supabase via connection pooling
    DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

    # Direct connection to the database. Used for migrations
    DIRECT_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
    ```

    ### Prisma マイグレーションの実行

    ```bash
    npx dotenv -e .env.local -- npx prisma migrate dev --name init
    ```

    これにより、データベースが初期化され、必要なテーブルが作成される。

4. **シードスクリプトの実行**: 初期データを挿入するためにシードスクリプトを実行。

    ```bash
    npm run seed
    ```

5. **開発サーバーの起動**: 以下のコマンドで開発サーバーを起動。

    ```bash
    npm run dev
    ```

    [http://localhost:3001](http://localhost:3001) でアクセス可能。ポートは `package.json` の `dev` スクリプトで変更できる。

6. **DB の変更を反映**: Prisma スキーマを変更した場合はマイグレーションを再実行する。
    ```bash
    npx dotenv -e .env.local -- npx prisma migrate dev --name [マイグレーション名]
    ```

## スクリプト一覧

| コマンド             | 説明                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| `npm run dev`        | Prisma クライアント生成 + 開発サーバー起動（Turbopack、ポート 3001） |
| `npm run build`      | Prisma クライアント生成 + マイグレーション適用 + 本番ビルド          |
| `npm run start`      | 本番サーバー起動                                                     |
| `npm run lint`       | ESLint の実行                                                        |
| `npm run format:fix` | Prettier + Prisma フォーマットの実行                                 |
| `npm run seed`       | シードスクリプトの実行（.env.local を使用）                          |

## Prisma の使用方法

Prisma は ORM（Object-Relational Mapping）ツールで、データベースとのやり取りを簡素化する。

### スキーマ定義

`prisma/schema.prisma` でモデルを定義する。Zod 型も `zod-prisma-types` で自動生成される。

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["views"]
  output          = "../src/generated/prisma"
}

generator zod {
  provider         = "zod-prisma-types"
  output           = "../src/generated/zod"
  createInputTypes = false
  createModelTypes = true
}
```

### 主なモデル

| モデル              | 概要                                                                |
| ------------------- | ------------------------------------------------------------------- |
| `Events`            | イベント（visibilityLevel / operationLevel で公開・操作権限を管理） |
| `EventTypes`        | イベント種別（路線図設定ファイルを紐付け）                          |
| `Teams`             | チーム                                                              |
| `Stations`          | 駅（`StationType`・`StationGrade` で種別・グレードを管理）          |
| `NearbyStations`    | 駅間接続情報（ダイクストラ法に使用）                                |
| `GoalStations`      | ゴール駅                                                            |
| `TransitStations`   | 経由駅（チームの移動履歴）                                          |
| `BombiiHistories`   | ボンビー履歴                                                        |
| `Points`            | ポイント履歴                                                        |
| `PropertyPurchases` | 物件購入履歴                                                        |
| `Documents`         | ドキュメント                                                        |
| `Attendances`       | 参加者情報                                                          |

### マイグレーション

```bash
# 開発環境用
npx dotenv -e .env.local -- npx prisma migrate dev --name <migration_name>

# 本番環境用（CI/CD で自動実行）
npx dotenv -e .env.production -- prisma migrate deploy

# Prisma クライアントの手動生成
npx prisma generate
```

## Supabase の使用方法

> **注意**: 本プロジェクトでは Prisma を使用するため、Supabase SDK はユーザー認証にのみ使用する。データベースへのアクセスはすべて Prisma 経由で行う。

### ローカル開発

```bash
# 起動
npx supabase start

# 停止
npx supabase stop

# 接続情報の確認
npx supabase status
```

### 本番環境セットアップ

1. Supabase のウェブサイトでプロジェクトを作成する。
2. プロジェクトの設定から API キーを取得する。
3. `.env.production` に接続情報を設定する。

## デプロイ

Vercel へのデプロイは `vercel.json` の設定に従い、以下のブランチで自動デプロイが実行される。

| ブランチ    | デプロイ       |
| ----------- | -------------- |
| `main`      | 本番環境       |
| `develop`   | プレビュー環境 |
| `release/*` | プレビュー環境 |
| `feature/*` | 無効           |

## 開発補助ツール

`tools/` ディレクトリに以下の開発補助ツールが含まれている。

| ツール                          | 概要                                           |
| ------------------------------- | ---------------------------------------------- |
| `roulette-probability-analyzer` | ルーレットの確率分布を分析するツール           |
| `routemap-checker`              | 路線図設定ファイルの整合性をチェックするツール |
| `station-distance-calculator`   | 駅間距離（移動時間）を計算するツール           |
