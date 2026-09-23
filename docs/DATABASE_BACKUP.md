# DB バックアップ手順

本番 Supabaseに対して、マイグレーションや RLS ポリシーなど
影響範囲の大きい変更を加える前にバックアップを取得する手順。`develop`/`release/*`（プレビュー環境）も
同じ Supabase プロジェクトを参照しているため、バックアップは本番・プレビュー両方に対する保険になる。

## 方法1: Supabase ダッシュボードから取得する（推奨・最速）

1. Supabase ダッシュボード → **Database** → **Backups** を開く
2. プランによって内容が異なる：
   - **Point-in-Time Recovery (PITR)**（Pro 以上 + Add-on）が有効な場合: 常時取得されているので、
     作業前の時刻をメモしておけば秒単位で戻せる
   - **Daily Backups**（Pro 以上の標準機能）: 直近の日次バックアップが並ぶ。念のため作業前に手動でも
     1つ取得しておく
   - **Free プラン**の場合は自動バックアップが無いため、方法2の手動ダンプが実質唯一の手段

ダッシュボード経由は操作だけで完結し、リストアもダッシュボードから行える。

## 方法2: `pg_dump` でローカルに `.sql` として取得する

ローカル環境に `pg_dump` はインストールされていない前提で、ローカル Supabase と同じ
Postgres イメージ（`public.ecr.aws/supabase/postgres:17.6.1.106`。本番も major version 17）を
Docker で一時起動し、そこに入っている `pg_dump` を使う。追加インストールは不要。

### 前提

- Docker Desktop が起動していること
- `.env.production` に `DIRECT_URL`（プーラーを経由しない直接接続。マイグレーション用の接続文字列）が
  設定されていること。`DATABASE_URL`（プーラー経由）ではなく **`DIRECT_URL` を使う**
- リポジトリ直下に `backups/` ディレクトリを作る（`.gitignore` に `/backups` を追加済みなので、
  本番データを含むダンプファイルが誤ってコミットされることはない）

### 実行コマンド

接続文字列（パスワードを含む）をターミナル履歴やログに残さないよう、シェル変数に読み込んでから
Docker に渡す。`MSYS_NO_PATHCONV` / `MSYS2_ARG_CONV_EXCL` は Git Bash（Windows）が
`-f /backups/...` のような `/` 始まりの引数を `C:\...` パスに書き換えてしまうのを防ぐためのもの
（Linux/macOS のシェルでは不要）。

```bash
mkdir -p backups

DIRECT_URL=$(grep '^DIRECT_URL=' .env.production | cut -d= -f2- | tr -d '"' | tr -d '\r')
OUT="backups/prod_backup_$(date +%Y%m%d_%H%M%S).sql"

MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL="*" docker run --rm \
  -v "$(pwd)/backups:/backups" \
  public.ecr.aws/supabase/postgres:17.6.1.106 \
  pg_dump "$DIRECT_URL" -F p --no-owner --no-privileges -f "/backups/$(basename "$OUT")"

unset DIRECT_URL
echo "backup written to $OUT"
```

オプションの意味：

| オプション            | 意味                                                                             |
| ---------------------- | --------------------------------------------------------------------------------- |
| `-F p`                 | plain SQL 形式で出力する（`psql` でそのまま流し込める）。圧縮・選択的リストアが必要なら `-F c`（custom format）に変える |
| `--no-owner`            | `ALTER ... OWNER TO` を出力しない（別ロールへのリストア時に権限エラーで止まらないようにする） |
| `--no-privileges`       | `GRANT`/`REVOKE` を出力しない（TSK-67 で設定した権限を上書きしないため）        |

### 取得できる内容

`DIRECT_URL` は Supabase の管理用ロールで接続するため、`public` スキーマだけでなく
`auth` / `storage` / `realtime` / `extensions` / `graphql` / `graphql_public` / `pgbouncer` / `vault`
を含む DB 全体がダンプされる。`public` 配下の全テーブル（`events` / `teams` / `points` / `users` /
`attendances` など）と `_prisma_migrations`（マイグレーション適用履歴）もデータ本体（`COPY ... FROM stdin`）
まで含まれる。

### 確認

```bash
DUMPFILE=backups/prod_backup_YYYYMMDD_HHMMSS.sql

# スキーマが揃っているか
grep -oP "CREATE SCHEMA \K\w+" "$DUMPFILE" | sort -u

# publicの各テーブルにデータ本体（COPY文）が入っているか
grep -E "^COPY public\." "$DUMPFILE"
```

## リストア方法

`.sql`（plain format）でダンプした場合、`psql` で流し込む。**復元先を間違えると本番を上書きするので、
接続先URLは必ず確認すること**。通常は新規に空の DB（ローカル Supabase やステージング環境）を用意して
検証用に流し込む。

```bash
MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL="*" docker run --rm \
  -v "$(pwd)/backups:/backups" \
  public.ecr.aws/supabase/postgres:17.6.1.106 \
  psql "<復元先の接続文字列>" -f "/backups/$(basename "$DUMPFILE")"
```

`-F c`（custom format）でダンプした場合は `pg_dump` の代わりに `pg_restore` を使う。

## 関連ドキュメント

- [CLAUDE.md](../CLAUDE.md) の「DB セキュリティ（RLS）」節: RLS ロックダウンの内容とその適用範囲
- `prisma/migrations/20260916221221_tsk_67_rls_lockdown/migration.sql`: `public` スキーマの RLS 設定
- `supabase/sql/create_storage_policies.sql` / `supabase/sql/create_realtime_policies.sql`:
  Storage / Realtime のポリシー（Supabase ダッシュボードの SQL Editor で手動実行するもの）
