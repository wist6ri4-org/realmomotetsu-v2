# API 基底クラス使用ガイド

## 概要

このプロジェクトでは、API エンドポイントの開発を効率化するための基底クラス `BaseApiHandler` を提供しています。この基底クラスを使用することで、ログ処理、エラーハンドリング、レスポンス形式の統一が自動的に行われます。

## 基本的な使用方法

### 1. API ハンドラークラスの作成

```typescript
import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { Handlers } from "@/app/api/utils/types";

class MyApiHandler extends BaseApiHandler {
    protected getHandlers(): Handlers {
        return {
            GET: this.handleGet.bind(this),
            POST: this.handlePost.bind(this),
            // 必要なHTTPメソッドを追加
        };
    }

    private async handleGet(req: NextRequest): Promise<NextResponse> {
        this.logInfo("Handling GET request");

        try {
            // ビジネスロジックを実装
            const data = await this.fetchSomeData();

            this.logInfo("Successfully fetched data", { count: data.length });
            return this.createSuccessResponse(data);
        } catch (error) {
            this.logError(error);
            throw error; // BaseApiHandlerがエラーハンドリングを行う
        }
    }

    private async handlePost(req: NextRequest): Promise<NextResponse> {
        this.logInfo("Handling POST request");

        try {
            const body = await req.json();
            this.logDebug("Request body", body);

            // バリデーション
            if (!body.name) {
                return this.createErrorResponse("Name is required", 400);
            }

            // ビジネスロジックを実装
            const result = await this.createSomeData(body);

            return this.createSuccessResponse(result, 201);
        } catch (error) {
            this.logError(error);
            throw error;
        }
    }

    private async fetchSomeData() {
        // データ取得ロジック
        return [];
    }

    private async createSomeData(data: any) {
        // データ作成ロジック
        return { id: 1, ...data };
    }
}

export default MyApiHandler;
```

### 2. route.ts ファイルでの使用

```typescript
import { createApiHandler } from "@/app/api/utils/apiHandler";
import MyApiHandler from "./MyApiHandler";

export const GET = createApiHandler(MyApiHandler);
export const POST = createApiHandler(MyApiHandler);
```

## 主な機能

### 自動ログ機能

-   **アクセスログ**: リクエストの受信、レスポンス時間、ステータスコードを自動記録
-   **エラーログ**: 例外発生時のスタックトレース付きログ
-   **リクエスト ID**: 各リクエストに一意の ID を付与してトレーサビリティを向上

### 統一されたレスポンス形式

#### 成功レスポンス

```json
{
    "data": {
        /* 実際のデータ */
    },
    "requestId": "req_1234567890_abc123",
    "timestamp": "2025-07-07T10:30:00.000Z"
}
```

#### エラーレスポンス

```json
{
    "error": "Error message",
    "requestId": "req_1234567890_abc123",
    "timestamp": "2025-07-07T10:30:00.000Z"
}
```

### 便利なヘルパーメソッド

-   `this.logInfo(message, data?)`: 情報ログ
-   `this.logDebug(message, data?)`: デバッグログ（開発環境のみ）
-   `this.logError(error)`: エラーログ
-   `this.createSuccessResponse(data, status?)`: 成功レスポンス作成
-   `this.createErrorResponse(message, status)`: エラーレスポンス作成

## 本番環境での拡張

`LogService` クラスは、本番環境での外部ログサービス統合に対応しています：

-   CloudWatch, Datadog 等への送信
-   Sentry, Bugsnag 等へのエラー追跡
-   設定により簡単に有効化可能

## 注意事項

1. **エラーハンドリング**: `handleXxx` メソッド内で `throw` された例外は、基底クラスが自動的にキャッチして適切なエラーレスポンスを返します
2. **ログレベル**: デバッグログは開発環境でのみ出力されます
3. **パフォーマンス**: レスポンス時間の測定が自動的に行われます
