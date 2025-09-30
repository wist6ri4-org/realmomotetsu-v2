# API エラーハンドリング ガイド

## 概要

このプロジェクトでは、API 用の統一されたエラーハンドリング機能を提供しています。各 API の service で catch したときに APIError を throw して、BaseAPIHandler で catch してログに出力する仕組みです。

## エラークラス階層

### 基底クラス

-   **ApiError**: すべての API エラーの基底クラス（抽象クラス）

### HTTP ステータスコード別エラー

-   **BadRequestError** (400): 不正なリクエスト
-   **UnauthorizedError** (401): 認証エラー
-   **ForbiddenError** (403): 認可エラー
-   **NotFoundError** (404): リソースが見つからない
-   **ConflictError** (409): 競合エラー
-   **UnprocessableEntityError** (422): 処理不可能なエンティティ
-   **InternalServerError** (500): 内部サーバーエラー
-   **ServiceUnavailableError** (503): サービス利用不可

### ビジネスエラー

-   **BusinessError**: ビジネスロジックエラーの基底クラス（抽象クラス）
-   **ResourceNotFoundError**: 特定リソースが見つからない
-   **DuplicateResourceError**: 重複リソースエラー
-   **InvalidOperationError**: 無効な操作
-   **BusinessRuleViolationError**: ビジネスルール違反
-   **DataIntegrityError**: データ整合性エラー
-   **ExternalServiceError**: 外部サービスエラー
-   **AuthenticationError**: 認証エラー
-   **AuthorizationError**: 認可エラー

## 使用方法

### 1. Service でのエラーの投げ方

```typescript
import { ResourceNotFoundError, DuplicateResourceError, InvalidOperationError } from "@/utils/error";

export class UserService {
    async getUserById(id: number) {
        const user = await this.userRepository.findById(id);

        if (!user) {
            // リソースが見つからない場合
            throw new ResourceNotFoundError("User", id);
        }

        return user;
    }

    async createUser(userData: CreateUserData) {
        // メールアドレスの重複チェック
        const existingUser = await this.userRepository.findByEmail(userData.email);
        if (existingUser) {
            throw new DuplicateResourceError("User", userData.email, {
                field: "email",
                value: userData.email,
            });
        }

        // ビジネスルールの検証
        if (userData.age < 18) {
            throw new InvalidOperationError("User creation", "User must be 18 or older", {
                providedAge: userData.age,
                minimumAge: 18,
            });
        }

        return await this.userRepository.create(userData);
    }

    async updateUserStatus(userId: number, status: string) {
        const user = await this.getUserById(userId); // ResourceNotFoundErrorが投げられる可能性

        try {
            await this.externalAPIService.validateStatus(status);
        } catch (error) {
            // 外部サービスエラー
            throw new ExternalServiceError("Status Validation Service", error as Error, {
                userId,
                status,
            });
        }

        return await this.userRepository.updateStatus(userId, status);
    }
}
```

### 2. API ハンドラーでの使用

```typescript
import { NextRequest, NextResponse } from "next/server";
import { BaseApiHandler } from "@/app/api/utils/BaseApiHandler";
import { UserService } from "./UserService";

class UsersApiHandler extends BaseApiHandler {
    private userService = new UserService();

    protected getHandlers() {
        return {
            GET: this.handleGet.bind(this),
            POST: this.handlePost.bind(this),
        };
    }

    private async handleGet(req: NextRequest): Promise<NextResponse> {
        try {
            const { searchParams } = new URL(req.url);
            const userId = parseInt(searchParams.get("id") || "");

            if (!userId) {
                // BadRequestErrorを使って400エラーを返す
                throw new BadRequestError("User ID is required");
            }

            // ServiceでResourceNotFoundErrorが投げられる可能性
            const user = await this.userService.getUserById(userId);

            return this.createSuccessResponse(user);
        } catch (error) {
            // BaseApiHandlerがAPIErrorを自動的にキャッチしてログに出力し、
            // 適切なレスポンスを返す
            return this.handleError(error);
        }
    }

    private async handlePost(req: NextRequest): Promise<NextResponse> {
        try {
            const body = await req.json();

            // ServiceでDuplicateResourceErrorやInvalidOperationErrorが
            // 投げられる可能性
            const newUser = await this.userService.createUser(body);

            return this.createSuccessResponse(newUser, 201);
        } catch (error) {
            return this.handleError(error);
        }
    }
}
```

### 3. カスタムエラーコードの使用

```typescript
// 特定のエラーコードを指定したい場合
throw new BadRequestError("Invalid user data", "INVALID_USER_DATA", {
    missingFields: ["name", "email"],
});

// ビジネスルール違反の例
throw new BusinessRuleViolationError("Users cannot have more than 5 active projects", {
    currentProjectCount: 7,
    maxAllowed: 5,
});
```

## レスポンス形式

### 通常の APIError

```json
{
    "error": "User with identifier '123' not found",
    "errorCode": "RESOURCE_NOT_FOUND",
    "details": {
        "resourceType": "User",
        "identifier": "123"
    },
    "requestId": "req-12345",
    "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### バリデーションエラー（ZodError）

```json
{
    "error": "Validation failed",
    "validationErrors": [
        {
            "field": "email",
            "message": "Invalid email format",
            "code": "invalid_string"
        }
    ],
    "requestId": "req-12345",
    "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## ログ出力

APIError が投げられた場合、BaseAPIHandler が自動的に以下の情報をログに出力します：

-   エラーメッセージ
-   エラーコード
-   HTTP ステータスコード
-   詳細情報（details）
-   リクエスト ID
-   スタックトレース

## ベストプラクティス

1. **適切なエラークラスの選択**: HTTP ステータスコードに応じて適切なエラークラスを使用する
2. **詳細情報の提供**: `details`パラメータを使用してデバッグに役立つ情報を含める
3. **一貫性のあるエラーコード**: 同じ種類のエラーには同じエラーコードを使用する
4. **外部サービスエラーの適切な処理**: ExternalServiceError を使用して元のエラー情報を保持する
5. **ビジネスロジックの分離**: ビジネスエラーは適切な BusinessError サブクラスを使用する
