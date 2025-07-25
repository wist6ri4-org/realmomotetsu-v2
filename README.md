# Real Momotetsu V2 基本仕様と開発環境のセットアップ
## ディレクトリ構成

```plaintext
├─node_modules      node.jsのモジュール
├─prisma            Prisma関連
|  ├─csv            シード用CSVファイル
│  └─migrations     データベースマイグレーション
├─public            静的ファイル（画像、フォントなど）
├─src               アプリケーションのソースコード
│  ├─app            Next.jsのアプリケーションディレクトリ。page.tsxによってルーティングされる。
│  │  └─api         APIエンドポイント。route.tsによってルーティングされる。
│  ├─components     再利用可能なUIコンポーネント。
│  │  ├─base        基本的なUIコンポーネント。ボタン、入力フィールド、カードなど。
│  │  └─composites  複合的なUIコンポーネント。ヘッダー、フッター、フォームなど。
│  ├─constants      定数定義
│  ├─features       機能ごとのサービス層。特定の機能に関連するファイルを集約する。APIに対応する。
│  ├─hooks          ドメインに依存しないカスタムフック。共通のロジックを再利用するために使用。
│  ├─lib            ライブラリ関数。APIクライアントなど。
│  ├─repositories   データアクセス層。
│  ├─theme          テーマ設定。アプリケーションのテーマやスタイルを定義する。
│  ├─types          TypeScriptの型定義。
│  └─utils          ユーティリティ関数。共通して使用される関数やヘルパー。
├─supabase          Supabaseの設定と一時ファイル
└─test              テスト関連
   └─http           HTTPリクエストのテスト
```

## 開発環境のセットアップ
1. **Node.jsとDockerのインストール**: Node.jsとDockerをインストールする。
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
3. **環境変数の設定**: `.env`ファイルを作成し、必要な環境変数を設定する（別途連携）。例:
    ```yaml
    DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
    NEXT_PUBLIC_API_URL=http://localhost:3000/api
    ```
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
    ```
    これにより、データベースが初期化され、必要なテーブルが作成されます。
5. **ビューの作成**: 必要なビューを作成する。supabase起動後、supabaseのSQLエディタで以下のSQLを実行。
    /supabase/sql/auth_hooks.sql
    /supabase/sql/views.sql

    これによりビューが作成されます。
6. **シードスクリプトの実行**: 初期データを挿入するためにシードスクリプトを実行します。
    ```bash
    npm run seed
    ```
7. **開発サーバーの起動**: 以下のコマンドで開発サーバーを起動します。
    ```bash
    npm run dev
    # または
    yarn dev
    # または
    pnpm dev
    # または
    bun dev
    ```
8. **DBの変更を反映**: 【Prismaスキーマを変更した場合】マイグレーションを再実行する。
    ```bash
    npx prisma migrate dev --name <migration_name>
    ```

## Prismaの使用方法
PrismaはORM（Object-Relational Mapping）ツールで、データベースとのやり取りを簡素化します。以下はPrismaの基本的な使用方法です。
### Prismaのセットアップ
1. **Prismaのインストール**: プロジェクトにPrismaを追加します。
    ```bash
    npm install prisma --save-dev
    npx prisma init
    ```
2. **スキーマの定義**: `prisma/schema.prisma` ファイルを編集して、データベースのモデルやビューを定義します。例えば、以下のようにユーザーモデル、ビューを定義できます。
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
    npx prisma migrate dev --name <migration_name>
    ```
4. **クライアントの生成**: Prismaクライアントを生成します。（現状ではnpm run devで自動的に実行される）
    ```bash
    npx prisma generate
    ```
### Prismaクライアントの使用
Prismaクライアントを使用してデータベースにアクセスする。以下は基本的なCRUD操作の例。
#### データの取得
```typescript
import { PrismaClient } from '@prisma/client';
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

## Supabaseの使用方法
SupabaseはオープンソースのFirebase代替で、リアルタイムデータベース、認証、ストレージなどの機能を提供している。以下はSupabaseの基本的な使用方法。
### Supabaseのセットアップ（本番環境）
1. **Supabaseのプロジェクト作成**: Supabaseのウェブサイトで新しいプロジェクトを作成する。
2. **APIキーの取得**: プロジェクトの設定からAPIキーを取得する。
3. **Supabaseクライアントのインストール**: プロジェクトにSupabaseクライアントを追加する。
    ```bash
    npm install @supabase/supabase-js
    ```
4. **Supabaseクライアントの初期化**: アプリケーションのエントリポイントでSupabaseクライアントを初期化する。
    ```typescript
    import { createClient } from '@supabase/supabase-js';

    const supabaseUrl = 'https://your-project.supabase.co';
    const supabaseKey = 'your-anon-key';
    const supabase = createClient(supabaseUrl, supabaseKey);
    ```
### Supabaseの使用（参考）
Supabaseを使用してデータベースにアクセスする。以下は基本的なCRUD操作の例。
<span style="color: red">本プロジェクトではPrismaを使用するため、Supabase SDKはユーザー認証にのみ使用。</span>

#### データの取得
```typescript
async function getUsers() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }
    return data;
}
```
#### データの作成
```typescript
async function createUser(name: string, email: string) {
    const { data, error } = await supabase.from('users').insert([{ name, email }]);
    if (error) {
        console.error('Error creating user:', error);
        return null;
    }
    return data[0];
}
```
#### データの更新
```typescript
async function updateUser(id: number, name: string) {
    const { data, error } = await supabase.from('users').update({ name }).eq('id', id);
    if (error) {
        console.error('Error updating user:', error);
        return null;
    }
    return data[0];
}
```
#### データの削除
```typescript
async function deleteUser(id: number) {
    const { data, error } = await supabase.from('users').delete().eq('id', id);
    if (error) {
        console.error('Error deleting user:', error);
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
他のポートで起動したい場合、package.jsonの`dev`スクリプトを変更する。
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
