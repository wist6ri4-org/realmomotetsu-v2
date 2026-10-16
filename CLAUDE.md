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
npm run check:rls      # dotenv -e .env.local -- node scripts/check-rls.mjs（RLS設定の検証）
npm run apply:manual-sql  # dotenv -e .env.local -- node scripts/apply-manual-sql.mjs（Storage/Realtimeポリシーの一括適用）
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

### 認証・認可（`src/app/api/utils/auth.ts`）

DB アクセスは Prisma が所有者ロール（`postgres`）で行うため、認可の実体はアプリ層（この節）にあり、DB の RLS（後述）はこの層を迂回する経路（PostgREST・Storage・Realtime）だけを塞いでいる。

- `BaseApiHandler.requireAuth()` は既定で `true`。`handle()` がハンドラー実行前に `resolveAuthUser()`（`Authorization: Bearer <access_token>` を Supabase Auth で検証し `public.users` を解決）を呼び、`this.authUser` / `getAuthUser()` で参照できるようにする。認証不要にするのは `POST /api/users`（サインアップ直後で未ログイン）だけで、個別に `requireAuth()` を `false` で override する。
- `eventCode` を扱うハンドラーは Zod パース直後に `assertEventAccess(user, eventCode, "view" | "operate")` を呼ぶ。判定ロジック本体（`checkIsOperatingUser` 等、`Users.masterRole` / `Attendances.eventRole` / `Events.visibilityLevel`・`operationLevel` の3軸）は `src/lib/authorization.ts` にあり、ブラウザ用クライアントを import している `src/lib/auth.ts` から再エクスポートしている。
- 対象ユーザー本人（または master admin）のみを許可する場合は `assertSelfOrMasterAdmin(user, targetUuid)` を使う（`GET/PUT /api/users/[uuid]`、`GET /api/init` の `uuid` パラメータなど）。
- セッションは localStorage 保持（`@supabase/ssr` 未導入）でサーバーは Cookie から JWT を取得できないため、クライアント側の `/api/*` 呼び出しは素の `fetch` ではなく `src/lib/apiClient.ts` の `apiFetch()` を使う（`Authorization` ヘッダーを自動付与する）。

### Repository パターン（`src/repositories/`）

すべてのリポジトリは `BaseRepository`（`src/repositories/base/BaseRepository.ts`）を継承し、`executeTransaction()` と `handleDatabaseError()`（Prisma の一意制約・外部キー制約違反を型付き例外に変換）を利用できる。リポジトリのインスタンスは必ず `RepositoryFactory` からシングルトンとして取得し、直接 `new` しない。複数リポジトリをまたぐトランザクションは `RepositoryFactory.withTransaction()` を使う。詳細は `src/repositories/README.md` を参照。

### フロントエンドのエラーハンドリング（`src/error/`）

API 側の `ApiError` とは別物として、フロントエンドでは `ApplicationError` / `ApplicationErrorFactory`（`src/error/applicationError.ts`）を使い、throw されたエラーや `fetch` 失敗（`ApplicationErrorFactory.createFromResponse` / `createNetworkError`）を正規化する。入力バリデーションは `ValidationErrorHandler`（`src/error/errorHandler.ts`）を使う。エラーコードは `src/constants/errorCodes.ts`、ユーザー向けメッセージは `src/constants/messages.ts`（`{placeholder}` 形式のテンプレートを `getMessage()` で展開）で一元管理しており、文字列をコード中にハードコードしない。詳細は `docs/ERROR_HANDLING_GUIDE.md` を参照。

### Prisma モデル

スキーマ定義は `prisma/schema.prisma`。生成されたクライアントは `src/generated/prisma`（Git 管理外）、Zod スキーマは `zod-prisma-types` により `src/generated/zod` に出力される。主なモデル: `Events`（`visibilityLevel`/`operationLevel` でアクセス制御を管理）、`EventTypes`（路線図設定に紐付く）、`Teams`、`Stations`、`NearbyStations`（ダイクストラ法で使用する駅の隣接グラフ）、`GoalStations`、`TransitStations`（チームごとの移動履歴）、`BombiiHistories`、`Points`、`PropertyPurchases`、`Documents`、`Attendances`。

### DB セキュリティ（RLS）

Prisma は `postgres` ロール（テーブル所有者かつ BYPASSRLS）で接続しているため、`public` スキーマに RLS を張ってもアプリのクエリには一切効かない。したがって RLS の役割は「PostgREST / GraphQL（ブラウザに露出している `NEXT_PUBLIC_SUPABASE_PUBLISHED_KEY` で誰でも叩ける経路）を閉じること」に限定している。認可の実体は上記の「認証・認可」節（アプリ層）にある。

- `public` スキーマ: 全テーブルで RLS を有効化し、ポリシーを一切作らない deny-all（`prisma/migrations/20260916221221_tsk_67_rls_lockdown/migration.sql`）。あわせて `anon`/`authenticated` からテーブル・シーケンス・関数の権限を `REVOKE`（`ALTER DEFAULT PRIVILEGES` で新規テーブルにも自動適用されないようにしている）。`current_app_user_id()` / `is_master_admin()` / `is_event_attendee(eventCode)` / `is_event_admin(eventCode)` の認可ヘルパー関数（`SECURITY DEFINER`）もここで作成し、Realtime のポリシーから利用する。
- `storage.objects`（Storage）・`realtime.messages`（Realtime）は所有者が `supabase_storage_admin`/`supabase_realtime_admin` で Prisma migration には含められないため、`supabase/sql/create_storage_policies.sql` / `supabase/sql/create_realtime_policies.sql` を別途適用する。`npm run apply:manual-sql`（`scripts/apply-manual-sql.mjs`）で一括適用できる（`DIRECT_URL` 経由で `CREATE POLICY`/`DROP POLICY` のみ実行し、所有者限定の `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` は `must be owner of table ...` を想定内として無視する。再実行しても安全）。Supabase ダッシュボードの SQL Editor に直接貼り付けて実行することもできる。Storage はユーザーが自分の `user-icons/{uuid}.*` のみ書き込み可能、Realtime は `event-{eventCode}` の private channel をそのイベントの参加者のみ購読可能にしている（サーバー側の送信は `SUPABASE_SECRET_KEY` を使う `src/lib/realtimeNotifier.ts` が RLS を迂回する）。
- `npm run check:rls`（`scripts/check-rls.mjs`）で RLS 無効テーブル・`anon`/`authenticated` への残存権限・`security_invoker` の無いビュー・`FORCE ROW LEVEL SECURITY` の誤設定・認可ヘルパー関数の有無を検査できる。Supabase では `postgres` ロールでイベントトリガーを作れず新規テーブルの RLS 有効化を DB 側で強制できないため、新しい `public` テーブルを追加したら実行すること。

### イベント画面のバージョン管理（`src/app/events/`）

イベント画面は `v02/` と `v03/` の並行したディレクトリツリーでバージョン管理されており、どちらも `[eventCode]/` 配下にある。イベント関連の挙動を変更する際は、v02・v03・両方のどこに該当するか確認すること（単純な別名ではない。例えば到着ゴール駅処理は `src/features/*-v3/` に v03 専用のサービス/検証ロジックが分離されている）。

### ルーレット・経路探索ロジック

「次の目的駅」を決めるルーレットは、`NearbyStations` に対する距離ベースの重み付きランダム選択であり、ダイクストラ法（`src/utils/dijkstraUtils.ts`）で計算している。路線図のレイアウト設定は `src/data/routemap/` 配下の JSON で、`tools/routemap-checker` と `scripts/generate-metro-config.js` で生成・整合性チェックを行う。

### 開発補助ツール（`tools/`）

アプリのビルドには含まれない独立したスクリプト群: `roulette-probability-analyzer`（ルーレットの確率分布分析）、`routemap-checker`（路線図 JSON の整合性チェック）、`station-distance-calculator`（駅間の移動時間計算）。

## デプロイ

`vercel.json` の設定に従い Vercel が自動デプロイを行う: `main` → 本番環境、`develop` と `release/*` → プレビュー環境、`feature/*` → デプロイなし。
