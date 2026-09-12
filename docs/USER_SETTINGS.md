# ユーザー設定機能

Supabase Authentication を利用したユーザー設定機能のドキュメント。

## 機能一覧

| 機能               | ページ                                                                  | 概要                                 |
| ------------------ | ----------------------------------------------------------------------- | ------------------------------------ |
| ユーザー設定メイン | `/events/{version}/{eventCode}/operation/user-settings`                 | 各設定画面へのナビゲーション         |
| プロフィール設定   | `/events/{version}/{eventCode}/operation/user-settings/profile`         | ニックネーム・メールアドレスの変更   |
| アイコン設定       | `/events/{version}/{eventCode}/operation/user-settings/icon`            | プロフィール画像のアップロード・変更 |
| パスワード変更     | `/events/{version}/{eventCode}/operation/user-settings/change-password` | パスワードの変更                     |

> `{version}` は `v02` / `v03`。ルーティングは `src/app/events/v02/[eventCode]/` および
> `src/app/events/v03/[eventCode]/` 配下に同じ構成で配置されている。
> イベント種別（`EventTypes.version`）に応じて `UserUtils.fetchEventCodeAndVersionPath()` が
> 遷移先のバージョンパスを解決する。

### 認証フロー用のページ

イベントに紐付かない認証系のページは `src/app/user/` 配下にある。

| ページ                          | 概要                           |
| ------------------------------- | ------------------------------ |
| `/user/signin`                  | サインイン                     |
| `/user/signup`                  | サインアップ                   |
| `/user/confirm-email`           | メールアドレスの確認           |
| `/user/resend-confirmation`     | 確認メールの再送               |
| `/user/reset-password/email`    | パスワードリセットメールの送信 |
| `/user/reset-password/password` | 新しいパスワードの設定         |
| `/user/change-password`         | パスワード変更                 |

## アーキテクチャ

```
Frontend (Next.js)
├── Pages
│   ├── src/app/user/                # 認証フロー（サインイン・サインアップ・パスワードリセット）
│   └── src/app/events/v02(v03)/[eventCode]/operation/user-settings/
│       ├── page.tsx                 # メイン画面
│       ├── profile/page.tsx         # プロフィール設定
│       ├── icon/page.tsx            # アイコン設定
│       └── change-password/page.tsx # パスワード変更
├── Hooks
│   └── src/hooks/useAuthGuard.ts    # 認証ガード
├── Contexts
│   └── src/contexts/UserIconContext.tsx  # アイコンURLのアプリ全体での共有・再取得
├── Components
│   └── src/components/composite/ApplicationBar.tsx  # ユーザーアバター表示
└── Utils
    ├── src/utils/userUtils.ts       # ユーザー操作ユーティリティ
    └── src/lib/auth.ts              # Supabase Auth のラッパー・権限判定

Backend
├── src/app/api/users/               # ユーザー登録 API (POST)
└── src/app/api/users/[uuid]/        # ユーザー情報 CRUD API (GET / PUT)

Supabase
├── Authentication                   # ユーザー管理・セッション管理
├── Database (PostgreSQL)
│   └── users テーブル + attendances テーブル + RLS Policies
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
  （雛形は `src/templates/email/` にある）
- **URL Configuration**: Site URL に `NEXT_PUBLIC_BASE_URL` と同じ URL を設定、Redirect URLs を追加

### ストレージ

詳細は [supabase/sql/setup_user_storage.md](../supabase/sql/setup_user_storage.md) を参照。

| 項目               | 設定値                               |
| ------------------ | ------------------------------------ |
| バケット名         | `user-assets`                        |
| ファイルパス       | `user-icons/{user_uuid}.{extension}` |
| Public bucket      | 有効                                 |
| File size limit    | 5 MB                                 |
| Allowed MIME types | `image/*`                            |

ストレージポリシー（4 種）を設定する。SQL は `supabase/sql/create_storage_policies.sql` にある。

| ポリシー         | 対象                                   |
| ---------------- | -------------------------------------- |
| アップロード許可 | 認証済みユーザー（自分のファイルのみ） |
| 更新許可         | 認証済みユーザー（自分のファイルのみ） |
| 閲覧許可         | 全員（パブリック）                     |
| 削除許可         | 認証済みユーザー（自分のファイルのみ） |

### データベース（RLS）

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid()::text = uuid);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = uuid);
```

## API 仕様

### `POST /api/users`

ユーザーを登録する。サインアップ時に Supabase Auth のユーザー作成と併せて呼び出す。

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
Supabase Auth のユーザーと、`public.users` に格納されたアプリ側のユーザー情報の
両方を返す。

```typescript
const { sbUser, user, isLoading } = useAuthGuard();
```

| 戻り値      | 型                           | 内容                                        |
| ----------- | ---------------------------- | ------------------------------------------- |
| `sbUser`    | `User \| null`               | Supabase Auth の認証ユーザー                |
| `user`      | `UsersWithRelations \| null` | `public.users` のユーザーデータ（関連含む） |
| `isLoading` | `boolean`                    | 認証状態のロード中フラグ                    |

### `UserIconContext`（`src/contexts/UserIconContext.tsx`）

アイコン URL をアプリ全体で共有し、アップロード後の再取得を制御するコンテキスト。
`useUserIcon()` で `userIconUrl` / `updateUserIcon` / `forceRefreshUserIcon` /
`clearUserIcon` を取得する。アイコン差し替え直後にヘッダーのアバターへ即座に反映させる用途で使う。

### `UserUtils` クラス（`src/utils/userUtils.ts`）

ユーザー操作のユーティリティクラス。ストレージ操作系はインスタンスメソッド、
イベント参加情報の取得系は静的メソッドとして提供している。

```typescript
const userUtils = new UserUtils();
const iconUrl = await userUtils.uploadUserIcon(file, userId);
```

**インスタンスメソッド**

| メソッド                                             | 概要                                              |
| ---------------------------------------------------- | ------------------------------------------------- |
| `uploadUserIcon(file, userId)`                       | アイコン画像をストレージにアップロードする        |
| `deleteUserIcon(userId)`                             | 既存のアイコン画像を削除する                      |
| `getUserIconUrl(userId)`                             | アイコンの公開 URL を組み立てる（拡張子は既定値） |
| `getUserIconUrlWithExtension(userId, forceRefresh?)` | 実在する拡張子を解決してアイコン URL を取得する   |
| `updateUserNickname(userId, nickname)`               | ニックネームを更新する                            |
| `updateUserEmail(userId, email)`                     | メールアドレスを更新する（Supabase Auth 連携）    |

**静的メソッド**

| メソッド                             | 概要                                                     |
| ------------------------------------ | -------------------------------------------------------- |
| `fetchUserAttendances(uuid)`         | ユーザーの直近の参加イベント情報を取得する               |
| `fetchEventCodeAndVersionPath(uuid)` | 参加中のイベントコードとバージョンパス（`v02` 等）を返す |
| `getUserIconUrlStatic(userId, ext?)` | インスタンス生成なしでアイコン URL を組み立てる          |
| `clearIconCache(userId)`             | 指定ユーザーのアイコンキャッシュを破棄する               |
| `clearAllIconCache()`                | アイコンキャッシュをすべて破棄する                       |

`uploadUserIcon` は同一ユーザー以外のアイコン変更を拒否し、アップロード後に
タイムスタンプ付きのキャッシュバスター（`?t=...`）を URL に付与する。
画像を差し替えたのに古い画像が表示される場合は、このキャッシュ機構を疑う。

## セキュリティ

| 機能               | 説明                                                     |
| ------------------ | -------------------------------------------------------- |
| 認証ガード         | `useAuthGuard` で未認証アクセスを制御                    |
| API 認証           | Bearer トークンによる API 呼び出し認証                   |
| 本人チェック       | `uploadUserIcon` で `session.user.id` と対象 UUID を照合 |
| RLS                | データベースレベルでのアクセス制御                       |
| ファイルサイズ制限 | 5 MB 以下（バケット設定）                                |
| ファイル形式制限   | 画像ファイルのみ（PNG, JPG, JPEG, GIF, WEBP）            |
| パスワード要件     | 6 文字以上（Supabase Auth の制約）                       |

権限判定（管理者・操作可能ユーザー・閲覧可能ユーザー）は `src/lib/auth.ts` の
`checkIsAdminUser` / `checkIsOperatingUser` / `checkIsVisibleUser` で行う。

## エラーハンドリング

| ステータス            | 原因                                        | 対処                           |
| --------------------- | ------------------------------------------- | ------------------------------ |
| 401 Unauthorized      | 認証切れ                                    | 再ログイン                     |
| 403 Forbidden         | RLS ポリシー違反 / ストレージポリシー未設定 | `setup_user_storage.md` を確認 |
| 404 Not Found         | リソースなし                                | —                              |
| 413 Payload Too Large | ファイルサイズ超過                          | 5 MB 以下の画像を使用          |

フロントエンド側でのエラーの投げ方・表示方法は
[docs/ERROR_HANDLING_GUIDE.md](ERROR_HANDLING_GUIDE.md) を参照。

## トラブルシューティング

**アイコンアップロードが失敗する**
→ [supabase/sql/setup_user_storage.md](../supabase/sql/setup_user_storage.md) の手順を確認し、
ストレージポリシーの Target Roles が `authenticated` になっているか確認する。

**アイコンを変更したのに古い画像が表示される**
→ `UserUtils.clearIconCache(userId)` でキャッシュを破棄するか、
`useUserIcon().forceRefreshUserIcon(userId)` を呼んで再取得する。

**認証エラーが発生する**
→ ページをリロードしてセッションを更新する。解消しない場合は再ログインする。

**RLS エラーが発生する**
→ Supabase ダッシュボードで RLS ポリシーの UUID 条件（`auth.uid()::text = uuid`）を確認する。
