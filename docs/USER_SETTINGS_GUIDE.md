# ユーザー設定機能 - 開発者ガイド

## 概要

本プロジェクトでは、Supabase を活用したユーザー設定機能を実装しています。
ユーザーはプロフィール情報の変更、アイコンのアップロード、パスワードの変更が可能です。

## 機能一覧

### ✅ 実装済み機能

-   **プロフィール設定**
    -   ニックネーム変更
    -   メールアドレス変更（Supabase Auth 連携）
-   **アイコン設定**
    -   画像アップロード（PNG, JPG, JPEG, GIF, WebP 対応）
    -   リアルタイムプレビュー
    -   既存アイコンの表示・更新
-   **パスワード変更**
    -   現在のパスワード認証
    -   新しいパスワード設定
-   **セキュリティ**
    -   認証ガード（useAuthGuard）
    -   API 認証（Bearer Token）
    -   RLS（Row Level Security）
    -   ファイルアップロード制限

## アーキテクチャ

```
Frontend (Next.js)
├── Pages
│   ├── /events/{eventCode}/operation/user-settings/
│   ├── /events/{eventCode}/operation/user-settings/profile/
│   ├── /events/{eventCode}/operation/user-settings/icon/
│   └── /events/{eventCode}/operation/user-settings/change-password/
├── Components
│   ├── useAuthGuard (認証ガード)
│   └── ApplicationBar (ユーザーアバター表示)
├── Utils
│   └── userUtils.ts (ユーザー操作ユーティリティ)
└── API Routes
    └── /api/users/{uuid} (ユーザー情報CRUD)

Backend (Supabase)
├── Authentication
│   ├── User Management
│   └── Session Management
├── Database (PostgreSQL)
│   ├── users テーブル
│   └── RLS Policies
└── Storage
    ├── user-assets バケット
    └── Storage Policies
```

## クイックスタート

### 1. 環境設定

```bash
# 環境変数の設定（.env.local）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 2. Supabase 設定

#### データベース設定

```sql
-- RLS有効化
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ポリシー作成
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = uuid);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = uuid);
```

#### ストレージ設定

詳細は `supabase/sql/setup_user_storage.md` を参照

1. `user-assets` バケット作成
2. ストレージポリシー設定（4 つ）
3. Target Roles を `authenticated` に設定

### 3. 開発サーバー起動

```bash
npm run dev
```

### 4. 機能テスト

1. アプリケーションにログイン
2. 右上のユーザーアイコン → 「ユーザー設定」
3. 各機能をテスト

## 開発ガイド

### ファイル構造

```
src/
├── app/events/[eventCode]/operation/user-settings/
│   ├── page.tsx                    # メイン設定画面
│   ├── profile/page.tsx           # プロフィール設定
│   ├── icon/page.tsx              # アイコン設定
│   └── change-password/page.tsx   # パスワード変更
├── components/composite/
│   └── ApplicationBar.tsx         # ヘッダーバー（アバター表示）
├── hooks/
│   └── useAuthGuard.ts           # 認証ガードフック
├── utils/
│   └── userUtils.ts              # ユーザー操作ユーティリティ
└── api/users/[uuid]/
    └── route.ts                  # ユーザーAPI
```

### 主要コンポーネント

#### UserUtils クラス

```typescript
// ユーザー操作のユーティリティクラス
class UserUtils {
    uploadUserIcon(file: File, userId: string): Promise<string | null>;
    updateUserNickname(userId: string, nickname: string): Promise<PutUsersResponse>;
    updateUserEmail(userId: string, email: string): Promise<PutUsersResponse>;
    getUserIconUrlWithExtension(userId: string): Promise<string | null>;
}
```

#### useAuthGuard フック

```typescript
// 認証状態管理フック
const { sbUser, user, isLoading } = useAuthGuard();
```

### API 設計

#### エンドポイント: `/api/users/{uuid}`

**GET** - ユーザー情報取得

```typescript
Response: GetUsersByUuidResponse {
  user: UsersWithRelations
}
```

**PUT** - ユーザー情報更新

```typescript
Request: {
  nickname?: string
  email?: string
  iconUrl?: string
}

Response: PutUsersByUuidResponse {
  user: UsersWithRelations
}
```

### セキュリティ実装

#### 認証フロー

1. クライアント: Supabase Auth でセッション取得
2. API 呼び出し: Bearer Token を Authorization ヘッダーに設定
3. サーバー: トークン検証 → RLS 適用 → データアクセス

#### RLS ポリシー

```sql
-- ユーザーは自分のデータのみアクセス可能
auth.uid()::text = uuid
```

#### ファイルアップロード制限

-   ファイルサイズ: 5MB 以下
-   ファイル形式: image/\* のみ
-   アクセス制御: 認証済みユーザーの自分のファイルのみ

## トラブルシューティング

### よくある問題

1. **403 Unauthorized (RLS Policy Violation)**

    - 原因: ストレージポリシー未設定、Target Roles 未設定
    - 解決: `setup_user_storage.md` の手順を実行

2. **アイコンが表示されない**

    - 原因: ファイルが存在しない、URL 生成エラー
    - 解決: `getUserIconUrlWithExtension()` で動的取得

3. **認証エラー**
    - 原因: セッション期限切れ、認証状態不整合
    - 解決: ページリロード、再ログイン

### デバッグ方法

1. **開発者ツール確認**:

    ```javascript
    // コンソールでセッション確認
    console.log(await supabase.auth.getSession());
    ```

2. **ネットワークタブ確認**:

    - API 呼び出しのステータスコード
    - Authorization ヘッダーの存在

3. **Supabase ダッシュボード確認**:
    - ストレージポリシー設定
    - RLS ポリシー設定
    - バケットの存在

## 今後の拡張予定

-   [ ] プロフィール画像のクロップ機能
-   [ ] 複数画像アップロード対応
-   [ ] ダークモード対応
-   [ ] アクセシビリティ向上
-   [ ] パフォーマンス最適化
-   [ ] 国際化対応

## 関連ドキュメント

-   [Supabase ストレージ設定ガイド](./supabase/sql/setup_user_storage.md)
-   [ユーザー設定機能詳細](./docs/PASSWORD_CHANGE.md)
-   [API 仕様書](./src/api/users/README.md) <!-- 作成予定 -->

## 貢献方法

1. 課題の特定
2. ブランチ作成（`feature/#{issue_number}_{feature_name}`）
3. 実装・テスト
4. プルリクエスト作成
5. レビュー・マージ

## ライセンス

本プロジェクトは [MIT License](LICENSE) の下で公開されています。
