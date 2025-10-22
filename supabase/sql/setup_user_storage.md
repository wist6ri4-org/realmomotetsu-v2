# Supabase ユーザーアイコンストレージ設定ガイド

## 概要

ユーザーアイコンアップロード機能のための Supabase ストレージ設定を行います。
この設定により、ユーザーは自分のプロフィールアイコンをアップロード・管理できるようになります。

## 前提条件

-   Supabase プロジェクトが作成済み
-   プロジェクトの管理者権限を持っている
-   基本的な RLS（Row Level Security）の知識

## 設定が必要な理由

`must be owner of table objects` エラーは、ストレージポリシーを作成するための権限が不足していることを示しています。
ストレージポリシーは Supabase ダッシュボードから手動で設定する必要があります。

## 設定手順

### 1. Supabase ダッシュボードにアクセス

1. [Supabase ダッシュボード](https://app.supabase.com)にログイン
2. プロジェクトを選択

### 2. ストレージバケットの作成

1. 左メニューから「Storage」を選択
2. 「Create bucket」をクリック
3. 以下の設定でバケットを作成：
    - **Name**: `user-assets`
    - **Public bucket**: チェックを入れる
    - **File size limit**: 5MB (5242880 bytes)
    - **Allowed MIME types**: `image/*`

### 3. ストレージポリシーの設定

「Storage」→「Policies」タブから以下の 4 つのポリシーを作成してください。
各ポリシーは**Target Roles**を`authenticated`に設定することが重要です。

#### 3.1 ユーザーアイコンのアップロード許可

-   **Policy name**: `Users can upload own icons`
-   **Policy type**: `INSERT`
-   **Target**: `objects`
-   **Target Roles**: `authenticated` ✅
-   **Policy definition**:

```sql
bucket_id = 'user-assets'
AND name LIKE CONCAT('user-icons/', auth.uid()::text, '%')
```

#### 3.2 ユーザーアイコンの更新許可

-   **Policy name**: `Users can update own icons`
-   **Policy type**: `UPDATE`
-   **Target**: `objects`
-   **Target Roles**: `authenticated` ✅
-   **Policy definition**:

```sql
bucket_id = 'user-assets'
AND name LIKE CONCAT('user-icons/', auth.uid()::text, '%')
```

#### 3.3 ユーザーアイコンの閲覧許可

-   **Policy name**: `Anyone can view user icons`
-   **Policy type**: `SELECT`
-   **Target**: `objects`
-   **Target Roles**: `authenticated` ✅, `anon` ✅
-   **Policy definition**:

```sql
bucket_id = 'user-assets'
```

#### 3.4 ユーザーアイコンの削除許可

-   **Policy name**: `Users can delete own icons`
-   **Policy type**: `DELETE`
-   **Target**: `objects`
-   **Target Roles**: `authenticated` ✅
-   **Policy definition**:

```sql
bucket_id = 'user-assets'
AND name LIKE CONCAT('user-icons/', auth.uid()::text, '%')
```

### 4. RLS (Row Level Security) の確認

ストレージの RLS が有効になっていることを確認してください：

```sql
-- ストレージテーブルのRLS状態確認
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' AND tablename = 'objects';
```

結果で`rowsecurity`が`true`になっていることを確認してください。

## 設定完了の確認

### 1. ストレージポリシーの設定確認

Supabase ダッシュボードで以下を確認：

1. `Storage` > `Policies` に 4 つのポリシーが作成されていること
2. 各ポリシーが正しいテーブル（`objects`）に適用されていること

### 2. 動作テスト

1. ユーザーアイコン編集ページ (`/events/{eventCode}/operation/user-settings/icon`) にアクセス
2. 画像ファイルを選択してアップロードを試行
3. エラーが発生しないことを確認

### 3. ブラウザの開発者ツールでデバッグ

エラーが続く場合は、以下を確認：

1. Network タブでアップロードリクエストの詳細を確認
2. Console タブで詳細なエラーメッセージを確認
3. ユーザーが正しくログインしていることを確認

## よくあるエラーと対処法

### 403 Unauthorized - "new row violates row-level security policy"

-   **原因**: ストレージポリシーが設定されていない、または Target Roles が未設定
-   **対処法**:
    1. 上記の手順 3 でストレージポリシーを設定
    2. 各ポリシーの Target Roles が正しく設定されていることを確認
    3. ポリシーの条件式が正しいことを確認

### 401 Unauthorized

-   **原因**: ユーザーがログインしていない、またはセッションが無効
-   **対処法**:
    1. 正しくログインしているか確認
    2. ブラウザをリロードしてセッションを更新
    3. 開発者ツールでセッション状態を確認

### バケットが見つからない (404)

-   **原因**: `user-assets`バケットが作成されていない
-   **対処法**: 上記の手順 2 でバケットを作成

### ファイルサイズエラー (413 Payload Too Large)

-   **原因**: 5MB を超えるファイルをアップロード
-   **対処法**: より小さいファイルを使用するか、バケットの設定を変更

### ポリシーが適用されない

-   **原因**:
    1. Target Roles が設定されていない
    2. ポリシーの条件式が間違っている
    3. RLS が無効になっている
-   **対処法**:
    1. 各ポリシーの Target Roles を確認・設定
    2. ポリシー条件式を再確認
    3. Storage > Settings で RLS が有効か確認

## 技術的な詳細

### ファイル命名規則

アップロードされるファイルは以下の命名規則に従います：

```
user-icons/{auth.uid()}.{extension}
```

例: `user-icons/a48997e9-3276-4fa4-a679-ff00836b179b.png`

### 対応ファイル形式

-   PNG (.png)
-   JPEG (.jpg, .jpeg)
-   GIF (.gif)
-   WebP (.webp)

### セキュリティモデル

1. **認証**: ユーザーは認証済みである必要があります
2. **認可**: ユーザーは自分の UID が含まれるファイルパスのみアクセス可能
3. **バリデーション**: クライアント・サーバー両側でファイル形式・サイズを検証

### パフォーマンス最適化

-   **CDN**: Supabase Storage は CDN を通じて配信されます
-   **キャッシュ**: 公開 URL は適切なキャッシュヘッダーが設定されます
-   **圧縮**: 画像は自動的に最適化されます

## ファイル構造

アップロードされたアイコンは以下の構造で保存されます：

```
user-assets/
  user-icons/
    {user_uuid}.{extension}
```
