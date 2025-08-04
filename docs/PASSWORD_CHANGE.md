# ユーザー設定機能

このプロジェクトには Supabase の Authentication 機能を使用したユーザー設定機能が実装されています。

## 機能概要

### 1. ユーザー設定メインページ

-   **ページ**: `/events/{eventCode}/operation/user-settings`
-   **説明**: ユーザー設定の各機能へのアクセスポイント
-   **機能**:
    -   プロフィール設定へのナビゲーション
    -   パスワード変更へのナビゲーション
    -   アイコン設定へのナビゲーション
    -   現在のユーザー情報の表示

### 2. プロフィール設定機能

-   **ページ**: `/events/{eventCode}/operation/user-settings/profile`
-   **説明**: ニックネームとメールアドレスの変更
-   **機能**:
    -   ニックネームの変更
    -   メールアドレスの変更（Supabase Auth 連携）
    -   リアルタイムバリデーション

### 3. アイコン設定機能

-   **ページ**: `/events/{eventCode}/operation/user-settings/icon`
-   **説明**: ユーザーアイコンのアップロード・変更
-   **機能**:
    -   画像ファイルのアップロード（PNG、JPG、JPEG、GIF、WEBP 対応）
    -   リアルタイムプレビュー
    -   5MB 以下のファイルサイズ制限
    -   既存アイコンの表示・更新

### 4. パスワード変更機能

-   **ページ**: `/events/{eventCode}/operation/user-settings/change-password`
-   **説明**: ログイン中のユーザーがパスワードを変更
-   **フロー**:
    1. 現在のパスワードを入力
    2. 新しいパスワードと確認用パスワードを入力
    3. パスワード変更完了

## アーキテクチャ

### 認証・認可

-   **認証ガード**: `useAuthGuard`フックによる認証状態の管理
-   **API 認証**: Bearer トークンによる API 呼び出し認証
-   **RLS (Row Level Security)**: Supabase レベルでのデータアクセス制御

### ストレージ設定

-   **バケット**: `user-assets`
-   **ファイル構造**: `user-icons/{user_uuid}.{extension}`
-   **アクセス制御**: ユーザーは自分のアイコンのみ操作可能

### API 設計

-   **エンドポイント**: `/api/users/{uuid}`
-   **メソッド**: GET（取得）、PUT（更新）
-   **認証**: Authorization ヘッダーで Bearer トークン送信

## 必要な環境変数

`.env.local`ファイルに以下の環境変数を設定してください：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000  # 本番環境では適切なURLに変更
```

## Supabase の設定

### 1. Authentication 設定

Supabase のダッシュボードで以下を設定：

1. **Email Templates**:

    - メール変更通知テンプレートの設定
    - パスワードリセットテンプレートの設定

2. **URL Configuration**:
    - Site URL に`NEXT_PUBLIC_BASE_URL`と同じ URL を設定
    - Redirect URLs に適切な URL を追加

### 2. ストレージ設定

詳細は `supabase/sql/setup_user_storage.md` を参照：

1. **バケット作成**:

    - バケット名: `user-assets`
    - Public bucket: 有効
    - File size limit: 5MB
    - Allowed MIME types: `image/*`

2. **ストレージポリシー**:
    - アップロード許可（認証済みユーザーのみ、自分のファイルのみ）
    - 更新許可（認証済みユーザーのみ、自分のファイルのみ）
    - 閲覧許可（全員、パブリックアクセス）
    - 削除許可（認証済みユーザーのみ、自分のファイルのみ）

### 3. データベース設定

1. **RLS (Row Level Security)**:

    - `users`テーブルで RLS を有効化
    - ユーザーは自分のレコードのみアクセス可能

2. **ポリシー設定**:

    ```sql
    -- ユーザーは自分のプロフィールのみ閲覧可能
    CREATE POLICY "Users can view own profile" ON public.users
        FOR SELECT USING (auth.uid()::text = uuid);

    -- ユーザーは自分のプロフィールのみ更新可能
    CREATE POLICY "Users can update own profile" ON public.users
        FOR UPDATE USING (auth.uid()::text = uuid);
    ```

## 使用方法

### ユーザー設定へのアクセス

1. **アプリケーションバーから**:

    - 右上のユーザーアイコンをクリック
    - 「ユーザー設定」を選択

2. **直接 URL**:
    - `/events/{eventCode}/operation/user-settings`にアクセス

### プロフィール設定

1. ユーザー設定画面から「プロフィール設定」をクリック
2. ニックネームまたはメールアドレスを変更
3. 「保存」ボタンで変更を確定

### アイコン設定

1. ユーザー設定画面から「アイコン設定」をクリック
2. 「画像を選択」ボタンで画像ファイルを選択
3. プレビューを確認
4. 「保存」ボタンでアップロード

### パスワード変更

1. ユーザー設定画面から「パスワード変更」をクリック
2. 現在のパスワードを入力
3. 新しいパスワードと確認用パスワードを入力
4. 「パスワードを変更」ボタンで変更を確定

## 技術仕様

### フロントエンド

-   **Framework**: Next.js 14 (App Router)
-   **UI Library**: Material-UI (MUI)
-   **State Management**: React Hooks (useState, useEffect)
-   **Authentication**: カスタム`useAuthGuard`フック

### バックエンド

-   **API Routes**: Next.js API Routes
-   **Database**: Supabase PostgreSQL
-   **Storage**: Supabase Storage
-   **Authentication**: Supabase Auth

### ファイル構造

```
src/app/events/[eventCode]/operation/user-settings/
├── page.tsx                    # ユーザー設定メイン画面
├── profile/page.tsx           # プロフィール設定画面
├── icon/page.tsx              # アイコン設定画面
└── change-password/page.tsx   # パスワード変更画面

src/utils/
└── userUtils.ts               # ユーザー関連ユーティリティ

src/api/users/[uuid]/
└── route.ts                   # ユーザー情報API
```

## セキュリティ機能

-   **認証ガード**: 未認証ユーザーのアクセス制御
-   **API 認証**: Bearer トークンによる API 呼び出し認証
-   **RLS**: データベースレベルでのアクセス制御
-   **ファイルアップロード制限**:
    -   ファイルサイズ制限（5MB 以下）
    -   ファイル形式制限（画像のみ）
    -   ユーザー認証によるアクセス制御
-   **パスワード要件**: 6 文字以上の制約
-   **バリデーション**: リアルタイム入力検証

## エラーハンドリング

### 一般的なエラー

-   **401 Unauthorized**: 認証が必要、ログインを促す
-   **403 Forbidden**: アクセス権限なし、RLS ポリシー違反
-   **404 Not Found**: リソースが見つからない
-   **413 Payload Too Large**: ファイルサイズ制限超過

### アイコンアップロード関連

-   **403 RLS Policy Violation**: ストレージポリシーの設定不備
-   **400 Bad Request**: 不正なファイル形式
-   **Network Error**: 接続エラー、サーバーエラー

### トラブルシューティング

1. **アイコンアップロードが失敗する場合**:

    - `supabase/sql/setup_user_storage.md`の設定手順を確認
    - Supabase ダッシュボードでストレージポリシーを確認

2. **認証エラーが発生する場合**:

    - ブラウザのデベロッパーツールでセッション状態を確認
    - ページをリロードして認証状態を更新

3. **RLS エラーが発生する場合**:
    - データベースの RLS ポリシーを確認
    - UUID の一致を確認

## 今後の拡張予定

-   **プロフィール画像のクロップ機能**
-   **複数画像のアップロード対応**
-   **ダークモード対応**
-   **アクセシビリティの向上**
-   **多言語対応**
