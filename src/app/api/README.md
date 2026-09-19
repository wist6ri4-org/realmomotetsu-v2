# API 基底クラス使用ガイド

## 概要

API エンドポイントの実装を統一するために `BaseApiHandler` 抽象クラスを提供している。
ログ処理・エラーハンドリング・レスポンス形式の統一が自動的に行われる。

## ファイル構成

```
src/app/api/utils/
├── BaseApiHandler.ts   # 抽象基底クラス
├── apiHandler.ts       # createApiHandler / createApiHandlerWithParams ファクトリ関数
├── logService.ts       # LogService（アクセスログ・エラーログ）
└── types.ts            # Handlers / LogContext / AccessLog / ErrorLog 型定義
```

## 基本的な実装手順

### 1. API ハンドラークラスを作成する

```typescript
// src/app/api/<endpoint>/<Name>ApiHandler.ts
import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";

class MyApiHandler extends BaseApiHandler {
    protected getHandlers(): Handlers {
        return {
            GET: this.handleGet.bind(this),
            POST: this.handlePost.bind(this),
        };
    }

    private async handleGet(req: NextRequest): Promise<NextResponse> {
        const { searchParams } = new URL(req.url);
        const queryParams = Object.fromEntries(searchParams.entries());

        // Zod でバリデーション（ZodError は BaseApiHandler が 400 に変換する）
        const validated = mySchema.parse(queryParams);

        const data = await MyService.getData(validated);
        return this.createSuccessResponse(data);
    }

    private async handlePost(req: NextRequest): Promise<NextResponse> {
        const body = await req.json();
        const validated = myPostSchema.parse(body);

        const result = await MyService.create(validated);
        return this.createSuccessResponse(result, 201);
    }
}

export default MyApiHandler;
```

### 2. route.ts でハンドラーを登録する

クエリパラメータのみを使う場合:

```typescript
// src/app/api/<endpoint>/route.ts
import { createApiHandler } from "@/app/api/utils/apiHandler";
import MyApiHandler from "./MyApiHandler";

export const GET = createApiHandler(MyApiHandler);
export const POST = createApiHandler(MyApiHandler);
```

URL パラメータ（`[id]` 等）を使う場合:

```typescript
import { createApiHandlerWithParams } from "@/app/api/utils/apiHandler";
import MyApiHandler from "./MyApiHandler";

export const GET = createApiHandlerWithParams(MyApiHandler);
```

`createApiHandlerWithParams` を使った場合、ハンドラークラスのコンストラクタは
`(req: NextRequest, params: T)` の形で URL パラメータを受け取る。

## エラーハンドリング

`handle()` メソッドが例外を自動的にキャッチし、適切なレスポンスに変換する。

| 例外の種類 | ステータス | 説明 |
|---|---|---|
| `ApiError` のサブクラス | `error.statusCode` | `errorCode` / `details` を含むレスポンスを返す |
| `ZodError` | 400 | バリデーションエラーとして処理 |
| その他 | 500 | Internal Server Error |

### ApiError の使い方

`src/error/apiError.ts` に定義されたクラスを `throw` するだけでよい。
`BaseApiHandler` が自動的にキャッチしてログ出力とレスポンス生成を行う。

```typescript
import { BadRequestError, NotFoundError } from "@/error";

// Service 層でスロー → BaseApiHandler がキャッチ
if (!team) {
    throw new NotFoundError({ message: "チームが見つかりません", errorCode: "TEAM_NOT_FOUND" });
}
```

## レスポンス形式

### 成功レスポンス (`createSuccessResponse`)

```json
{
    "data": { ... },
    "requestId": "req_1234567890_abc123",
    "timestamp": "2026-08-04T10:30:00.000Z"
}
```

### エラーレスポンス (`createErrorResponse`)

```json
{
    "error": "Error message",
    "requestId": "req_1234567890_abc123",
    "timestamp": "2026-08-04T10:30:00.000Z"
}
```

### ApiError レスポンス (`createApiErrorResponse`)

```json
{
    "error": "チームが見つかりません",
    "errorCode": "TEAM_NOT_FOUND",
    "details": null,
    "requestId": "req_1234567890_abc123",
    "timestamp": "2026-08-04T10:30:00.000Z"
}
```

## ログ

`LogService` が以下のログを自動で出力する。

| ログ種別 | タイミング |
|---|---|
| リクエスト受信ログ | `handle()` の開始時 |
| アクセスログ | レスポンス返却時（ステータスコード・レスポンス時間を含む） |
| エラーログ | 例外発生時（スタックトレース付き） |

本番環境では `LogService` 内の TODO 箇所に CloudWatch / Datadog 等への送信処理を追加できる。

## 注意事項

- ハンドラーメソッド内で `throw` した例外は `BaseApiHandler.handle()` が自動でキャッチする
- `ZodError` は自動で 400 に変換されるため、ハンドラー側での個別の try-catch は不要
- URL パラメータを使う場合は `createApiHandlerWithParams` を使用する
