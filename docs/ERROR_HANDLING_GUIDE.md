# フロントエンドエラーハンドリングガイド

## 概要

フロントエンドのエラーハンドリングは以下の仕組みで統一している。

| クラス / 関数 | 場所 | 役割 |
|---|---|---|
| `ApplicationError` | `src/error/applicationError.ts` | フロントエンド用エラークラス |
| `ApplicationErrorFactory` | `src/error/applicationError.ts` | エラー生成・正規化のファクトリ |
| `ValidationErrorHandler` | `src/error/errorHandler.ts` | 入力バリデーション用ユーティリティ |
| `ErrorCodes` | `src/constants/errorCodes.ts` | エラーコード定数 |
| `Messages` / `getMessage` | `src/constants/messages.ts` | メッセージテンプレート管理 |

---

## エラーの投げ方

### 基本

```typescript
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ErrorCodes } from "@/constants/errorCodes";
import { getMessage } from "@/constants/messages";

// シンプルなエラー
throw ApplicationErrorFactory.create(ErrorCodes.VALIDATION_ERROR, "バリデーションエラーが発生しました。");

// メッセージ定数を使う（推奨）
throw ApplicationErrorFactory.create(
    ErrorCodes.REQUIRED_FIELD_ERROR,
    getMessage("FIELD_IS_REQUIRED", { field: "チーム" })
);
```

### キャッチして統一処理

```typescript
import { ApplicationErrorFactory } from "@/error/applicationError";

try {
    // 何らかの処理
} catch (err) {
    // 不明な型のエラーを ApplicationError に正規化する
    const appError = ApplicationErrorFactory.normalize(err);

    await showAlertDialog({
        title: "エラー",
        message: appError.message,
    });
}
```

---

## バリデーション

```typescript
import { ValidationErrorHandler } from "@/error/errorHandler";

// 必須チェック
ValidationErrorHandler.validateRequired(value, "チーム名");

// 正の値チェック
ValidationErrorHandler.validatePositive(points, "ポイント");

// 最小値チェック
ValidationErrorHandler.validateMinValue(value, 1, "ポイント");

// 最大値チェック
ValidationErrorHandler.validateMaxValue(value, 100, "スコア");

// 範囲チェック
ValidationErrorHandler.validateRange(score, 0, 100, "スコア");
```

---

## API 呼び出しのエラーハンドリング

```typescript
import { ApplicationError, ApplicationErrorFactory } from "@/error/applicationError";

try {
    const response = await fetch("/api/users");
    if (!response.ok) {
        throw ApplicationErrorFactory.createFromResponse(response);
    }
} catch (error) {
    if (error instanceof ApplicationError) {
        throw error; // 上位で処理
    }
    throw ApplicationErrorFactory.createNetworkError(error instanceof Error ? error : undefined);
}
```

---

## メッセージテンプレート

`src/constants/messages.ts` の `Messages` 定数でメッセージを一元管理している。
プレースホルダーは `{変数名}` 形式で記述する。

### 追加方法

```typescript
// src/constants/messages.ts
export const Messages = {
    // 既存のメッセージ...
    MY_NEW_MESSAGE: "{name}の処理に失敗しました。",
} as const;
```

### 使用方法

```typescript
import { getMessage } from "@/constants/messages";

const message = getMessage("MY_NEW_MESSAGE", { name: "チーム登録" });
// → "チーム登録の処理に失敗しました。"
```

---

## エラーコード

`src/constants/errorCodes.ts` の `ErrorCodes` 定数で一元管理している。

| コード | 用途 |
|---|---|
| `UNKNOWN_ERROR` | 不明なエラー |
| `NETWORK_ERROR` | ネットワークエラー |
| `SERVER_ERROR` | サーバーエラー（5xx） |
| `VALIDATION_ERROR` | 汎用バリデーションエラー |
| `REQUIRED_FIELD_ERROR` | 必須項目未入力 |
| `INVALID_FORMAT_ERROR` | 入力形式不正 |
| `VALUE_OUT_OF_RANGE_ERROR` | 値が範囲外 |
| `DUPLICATE_ENTRY` | 重複エントリ |
| `API_REQUEST_FAILED` | API リクエスト失敗（4xx） |

### 追加方法

```typescript
// src/constants/errorCodes.ts
export const ErrorCodes = {
    // 既存のコード...
    MY_NEW_ERROR: "MY_NEW_ERROR",
} as const;
```

---

## ベストプラクティス

- エラーメッセージは `Messages` で一元管理し、コード中に文字列ハードコードしない
- 不明な型のエラーをキャッチした場合は `ApplicationErrorFactory.normalize()` で正規化する
- 入力バリデーションには `ValidationErrorHandler` を使う
- API 呼び出しは `ApplicationErrorFactory.createFromResponse()` / `createNetworkError()` でエラー変換する
