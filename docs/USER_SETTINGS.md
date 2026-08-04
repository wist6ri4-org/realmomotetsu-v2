# ユーザー設定機能

Supabase Authentication を利用したユーザー設定機能のドキュメント。

## 機能一覧

| 機能 | ページ | 概要 |
|---|---|---|
| ユーザー設定メイン | `/events/{eventCode}/operation/user-settings` | 各設定画面へのナビゲーション |
| プロフィール設定 | `/events/{eventCode}/operation/user-settings/profile` | ニックネーム・メールアドレスの変更 |
| アイコン設定 | `/events/{eventCode}/operation/user-settings/icon` | プロフィール画像のアップロード・変更 |
| パスワード変更 | `/events/{eventCode}/operation/user-settings/change-password` | パスワードの変更 |

> ルーティングは `src/app/events/v02/[eventCode]/` および `src/app/events/v03/[eventCode]/` 配下に配置されている。

## アーキテクチャ

```
Frontend (Next.js)
├── Pages
│   └── src/app/events/v02(v03)/[eventCode]/operation/user-settings/
│       ├── page.tsx                 # メイン画面
│       ├── profile/page.tsx         # プロフィール設定
│       ├── icon/page.tsx            # アイコン設定
│       └── change-password/page.tsx # パスワード変更
├── Hooks
│   └── src/hooks/useAuthGuard.ts    # 認証ガード
├── Components
│   └── src/components/composite/ApplicationBar.tsx  # ユーザーアバター表示
└── Utils
    └── src/utils/userUtils.ts       # ユーザー操作ユーティリティ

Backend
└── src/app/api/users/[uuid]/        # ユーザー情報 CRUD API (GET / PUT)

Supabase
├── Authentication                   # ユーザー管理・セッション管理
├── Database (PostgreSQL)
│   └── users テーブル + RLS Policies
└── Storage
    └── user-assets バケット
```

## 必要な環境変数

`.env.local` に以下を設定する。

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHED_KEY=your_supabase_published_key
NEXT_PUBLIC_BASE_URL=http://localhost:3001
```

## Supabase の設定

### Authentication

Supabase ダッシュボードで以下を設定する。

- **Email Templates**: メール変更・パスワードリセットのテンプレート
- **URL Configuration**: Site URL に `NEXT_PUBLIC_BASE_URL` と同じ URL を設定、Redirect URLs を追加

### ストレージ

詳細は `supabase/sql/setup_user_storage.md` を参照。

| 項目 | 設定値 |
|---|---|
| バケット名 | `user-assets` |
| ファイルパス | `user-icons/{user_uuid}.{extension}` |
| Public bucket | 有効 |
| File size limit | 5 MB |
| Allowed MIME types | `image/*` |

ストレージポリシー（4 種）を設定する。

| ポリシー | 対象 |
|---|---|
| アップロード許可 | 認証済みユーザー（自分のファイルのみ） |
| 更新許可 | 認証済みユーザー（自分のファイルのみ） |
| 閲覧許可 | 全員（パブリック） |
| 削除許可 | 認証済みユーザー（自分のファイルのみ） |

### データベース（RLS）

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = uuid);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = uuid);
```

## API 仕様

### `GET /api/users/{uuid}`

ユーザー情報を取得する。

- **認証**: Authorization ヘッダーに Bearer トークンを付与

### `PUT /api/users/{uuid}`

ユーザー情報を更新する。

```typescript
// リクエストボディ（すべてオプション）
{
    nickname?: string;
    email?: string;
    iconUrl?: string;
}
```

## 主要コンポーネント

### `useAuthGuard` フック

認証状態を管理するカスタムフック。未認証の場合はリダイレクトする。

```typescript
const { sbUser, user, isLoading } = useAuthGuard();
```

### `UserUtils` クラス（`src/utils/userUtils.ts`）

ユーザー操作のユーティリティクラス。

| メソッド | 概要 |
|---|---|
| `uploadUserIcon(file, userId)` | アイコン画像をストレージにアップロード |
| `updateUserNickname(userId, nickname)` | ニックネームを更新 |
| `updateUserEmail(userId, email)` | メールアドレスを更新（Supabase Auth 連携） |
| `getUserIconUrlWithExtension(userId)` | 現在のアイコン URL を取得 |

## セキュリティ

| 機能 | 説明 |
|---|---|
| 認証ガード | `useAuthGuard` で未認証アクセスを制御 |
| API 認証 | Bearer トークンによる API 呼び出し認証 |
| RLS | データベースレベルでのアクセス制御 |
| ファイルサイズ制限 | 5 MB 以下 |
| ファイル形式制限 | 画像ファイルのみ（PNG, JPG, JPEG, GIF, WEBP） |
| パスワード要件 | 6 文字以上（Supabase Auth の制約） |

## エラーハンドリング

| ステータス | 原因 | 対処 |
|---|---|---|
| 401 Unauthorized | 認証切れ | 再ログイン |
| 403 Forbidden | RLS ポリシー違反 / ストレージポリシー未設定 | `setup_user_storage.md` を確認 |
| 404 Not Found | リソースなし | — |
| 413 Payload Too Large | ファイルサイズ超過 | 5 MB 以下の画像を使用 |

## トラブルシューティング

**アイコンアップロードが失敗する**
→ `supabase/sql/setup_user_storage.md` の手順を確認し、ストレージポリシーの Target Roles が `authenticated` になっているか確認する。

**認証エラーが発生する**
→ ページをリロードしてセッションを更新する。解消しない場合は再ログインする。

**RLS エラーが発生する**
→ Supabase ダッシュボードで RLS ポリシーの UUID 条件（`auth.uid()::text = uuid`）を確認する。
