# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Real Momotetsu V2 は、桃鉄風のチーム対抗移動ゲーム/イベントをリアルタイムで運営するための Next.js（App Router）製 Web アプリケーション。ORM に Prisma、バックエンドサービスに Supabase（Postgres・認証・ストレージ）を利用している。Supabase SDK はユーザー認証にのみ使用し、DB アクセスはすべて Prisma 経由で行う。

## コマンド

```bash
npm run dev          # prisma generate + next dev --turbopack -p 3001 (http://localhost:3001)
npm run build         # prisma generate + prisma migrate deploy + next build
npm run start         # 本番サーバー起動
npm run lint           # ESLint の実行（next lint）
npm run format:fix    # Prettier + Prisma フォーマット
npm run seed           # dotenv -e .env.local -- node prisma/seed.mjs（既存データを削除するので注意）
```

テストは Jest を使用しているが `npm test` スクリプトは無いため、npx で直接実行する。

```bash
npx jest                                   # 全テスト実行
npx jest __tests__/error/apiError.test.ts  # 単一テストファイルの実行
npx jest -t "test name substring"          # テスト名で絞り込んで実行
```

Prisma のワークフロー:

```bash
npx dotenv -e .env.local -- npx prisma migrate dev --name <migration_name>   # 開発用マイグレーション
npx dotenv -e .env.production -- prisma migrate deploy                        # 本番用マイグレーション（CI/CD）
npx prisma generate                                                            # クライアントのみ再生成
```

ローカル Supabase（事前に Docker Desktop を起動しておくこと）:

```bash
npx supabase start   # Studio :54323, Postgres :54322, API :54321
npx supabase stop
npx supabase status  # .env.local の接続情報を紛失した場合の再確認
```

Node のバージョンは `.nvmrc`（22.17.0）で固定されている。

## アーキテクチャ

リクエストの流れはレイヤー化されており、一方向。

```
src/app/ (ページ、App Router)
  -> src/app/api/<endpoint>/route.ts     (createApiHandler でハンドラーを登録)
  -> src/app/api/<endpoint>/<Name>ApiHandler.ts  (BaseApiHandler を継承)
  -> src/features/<feature>/service.ts    (ビジネスロジック)
  -> src/repositories/<entity>/<Entity>Repository.ts  (BaseRepository を継承)
  -> src/lib/prisma.ts -> Supabase Postgres
```

### API ハンドラーパターン（`src/app/api/`）

各エンドポイントは `BaseApiHandler`（`src/app/api/utils/BaseApiHandler.ts`）を継承したクラスとして実装し、リクエストログ・エラーハンドリング・レスポンス形式を一元化している。`route.ts` は `createApiHandler`（クエリパラメータのみ）または `createApiHandlerWithParams`（`[id]` などの動的ルート）でクラスを登録するだけ。ハンドラーは `src/features/*` のサービス層を呼び出す構造とし、リポジトリを直接呼び出さない。詳細は `src/app/api/README.md` を参照。

エラー処理: サービス/ハンドラーからは `ApiError` のサブクラス（`src/error/apiError.ts`）を throw する。`BaseApiHandler.handle()` がこれと `ZodError`（400 にマッピング）を自動でキャッチし、`{ error, errorCode, details, requestId, timestamp }` 形式のレスポンスを生成する。バリデーションはハンドラー内で Zod スキーマを直接 parse して行う。

### Repository パターン（`src/repositories/`）

すべてのリポジトリは `BaseRepository`（`src/repositories/base/BaseRepository.ts`）を継承し、`executeTransaction()` と `handleDatabaseError()`（Prisma の一意制約・外部キー制約違反を型付き例外に変換）を利用できる。リポジトリのインスタンスは必ず `RepositoryFactory` からシングルトンとして取得し、直接 `new` しない。複数リポジトリをまたぐトランザクションは `RepositoryFactory.withTransaction()` を使う。詳細は `src/repositories/README.md` を参照。

### フロントエンドのエラーハンドリング（`src/error/`）

API 側の `ApiError` とは別物として、フロントエンドでは `ApplicationError` / `ApplicationErrorFactory`（`src/error/applicationError.ts`）を使い、throw されたエラーや `fetch` 失敗（`ApplicationErrorFactory.createFromResponse` / `createNetworkError`）を正規化する。入力バリデーションは `ValidationErrorHandler`（`src/error/errorHandler.ts`）を使う。エラーコードは `src/constants/errorCodes.ts`、ユーザー向けメッセージは `src/constants/messages.ts`（`{placeholder}` 形式のテンプレートを `getMessage()` で展開）で一元管理しており、文字列をコード中にハードコードしない。詳細は `docs/ERROR_HANDLING_GUIDE.md` を参照。

### Prisma モデル

スキーマ定義は `prisma/schema.prisma`。生成されたクライアントは `src/generated/prisma`（Git 管理外）、Zod スキーマは `zod-prisma-types` により `src/generated/zod` に出力される。主なモデル: `Events`（`visibilityLevel`/`operationLevel` でアクセス制御を管理）、`EventTypes`（路線図設定に紐付く）、`Teams`、`Stations`、`NearbyStations`（ダイクストラ法で使用する駅の隣接グラフ）、`GoalStations`、`TransitStations`（チームごとの移動履歴）、`BombiiHistories`、`Points`、`PropertyPurchases`、`Documents`、`Attendances`。

### イベント画面のバージョン管理（`src/app/events/`）

イベント画面は `v02/` と `v03/` の並行したディレクトリツリーでバージョン管理されており、どちらも `[eventCode]/` 配下にある。イベント関連の挙動を変更する際は、v02・v03・両方のどこに該当するか確認すること（単純な別名ではない。例えば到着ゴール駅処理は `src/features/*-v3/` に v03 専用のサービス/検証ロジックが分離されている）。

### ルーレット・経路探索ロジック

「次の目的駅」を決めるルーレットは、`NearbyStations` に対する距離ベースの重み付きランダム選択であり、ダイクストラ法（`src/utils/dijkstraUtils.ts`）で計算している。路線図のレイアウト設定は `src/data/routemap/` 配下の JSON で、`tools/routemap-checker` と `scripts/generate-metro-config.js` で生成・整合性チェックを行う。

### 開発補助ツール（`tools/`）

アプリのビルドには含まれない独立したスクリプト群: `roulette-probability-analyzer`（ルーレットの確率分布分析）、`routemap-checker`（路線図 JSON の整合性チェック）、`station-distance-calculator`（駅間の移動時間計算）。

## デプロイ

`vercel.json` の設定に従い Vercel が自動デプロイを行う: `main` → 本番環境、`develop` と `release/*` → プレビュー環境、`feature/*` → デプロイなし。
