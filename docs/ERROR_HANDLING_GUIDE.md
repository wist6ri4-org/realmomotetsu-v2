# フロントエンドエラーハンドリングガイド

## 概要

このプロジェクトでは、フロントエンドでのエラーハンドリングを統一的に管理するため、以下の仕組みを提供しています：

1. **ApplicationError クラス**: アプリケーション固有のエラーを表現
2. **メッセージ管理システム**: 多言語対応と変数置換機能を持つメッセージ管理
3. **エラーハンドリングユーティリティ**: 汎用的なエラー処理

## 使用方法

### 1. 基本的なエラーの投げ方

```typescript
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ErrorCodes } from "@/constants/errorCodes";
import { getMessage } from "@/constants/messages";

// 基本的なエラー
throw ApplicationErrorFactory.create(ErrorCodes.VALIDATION_ERROR, "バリデーションエラーが発生しました。");

// メッセージ定数を使用
throw ApplicationErrorFactory.create(
    ErrorCodes.VALIDATION_ERROR,
    getMessage("FIELD_IS_REQUIRED", { field: "ユーザー名" })
);
```

### 2. バリデーションエラー

```typescript
import { ValidationErrorHandler } from "@/utils/errorHandler";

// 必須チェック
ValidationErrorHandler.validateRequired(value, "ユーザー名");

// 正の値チェック
ValidationErrorHandler.validatePositive(points, "ポイント");

// 範囲チェック
ValidationErrorHandler.validateRange(score, 0, 100, "スコア");
```

### 3. API エラー処理

```typescript
import { ApiErrorHandler } from "@/utils/errorHandler";

try {
    const response = await fetch("/api/users");
    if (!response.ok) {
        throw ApiErrorHandler.createFromResponse(response);
    }
} catch (error) {
    if (error instanceof ApplicationError) {
        throw error;
    }
    throw ApiErrorHandler.createNetworkError(error instanceof Error ? error : undefined);
}
```

### 4. 統一的なエラーハンドリング

```typescript
import { ApplicationErrorFactory } from "@/error/applicationError";

try {
    // 何らかの処理
} catch (err) {
    const appError = ApplicationErrorFactory.fromUnknownError(err);

    // エラーダイアログ表示
    await showAlertDialog({
        title: "エラー",
        message: appError.message,
    });
}
```

## メッセージの追加方法

### 1. messages.ts に新しいメッセージを追加

```typescript
export const Messages = {
    // 既存のメッセージ...

    // 新しいメッセージ
    USER_AGE_INVALID: "{name}さんの年齢は{min}歳以上{max}歳以下で入力してください。",
} as const;
```

### 2. 使用例

```typescript
import { getMessage } from "@/constants/messages";

const message = getMessage("USER_AGE_INVALID", {
    name: "田中",
    min: "18",
    max: "65",
});
// 結果: "田中さんの年齢は18歳以上65歳以下で入力してください。"
```

## エラーコードの追加方法

### 1. errorCodes.ts に新しいエラーコードを追加

```typescript
export const ErrorCodes = {
    // 既存のエラーコード...

    // 新しいエラーコード
    USER_AGE_INVALID: "USER_AGE_INVALID",
} as const;
```

### 2. 使用例

```typescript
import { ErrorCodes } from "@/constants/errorCodes";
import { ApplicationErrorFactory } from "@/error/applicationError";

throw ApplicationErrorFactory.create(
    ErrorCodes.USER_AGE_INVALID,
    getMessage("USER_AGE_INVALID", { name: "田中", min: "18", max: "65" })
);
```

## ベストプラクティス

1. **エラーメッセージは messages.ts で一元管理**
2. **変数を含むメッセージはテンプレート形式で記述**
3. **エラーコードは意味のある名前を付ける**
4. **ApplicationErrorFactory.fromUnknownError() で不明なエラーを統一的に処理**
5. **バリデーションには ValidationErrorHandler を使用**
6. **API 呼び出しには ApiErrorHandler を使用**

## 実装例

完全な実装例については、`ArrivalGoalStationsForm.tsx` を参照してください。
