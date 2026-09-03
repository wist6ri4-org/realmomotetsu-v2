# フロントエンドエラーハンドリングガイド

## 概要

このドキュメントはフロントエンド（React コンポーネント・フック・`src/utils/`）のエラーハンドリングを扱う。
サーバーサイド（API ハンドラー・サービス層・リポジトリ）は `ApiError` 系の別体系を使うため、
[src/error/README.md](../src/error/README.md) と [src/app/api/README.md](../src/app/api/README.md) を参照。

| クラス / 関数             | 場所                            | 役割                               |
| ------------------------- | ------------------------------- | ---------------------------------- |
| `ApplicationError`        | `src/error/applicationError.ts` | フロントエンド用エラークラス       |
| `ApplicationErrorFactory` | `src/error/applicationError.ts` | エラー生成・正規化のファクトリ     |
| `ValidationErrorHandler`  | `src/error/errorHandler.ts`     | 入力バリデーション用ユーティリティ |
| `ApplicationErrorHandler` | `src/error/errorHandler.ts`     | エラーログ出力用ユーティリティ     |
| `ErrorCodes`              | `src/constants/errorCodes.ts`   | エラーコード定数                   |
| `Messages` / `getMessage` | `src/constants/messages.ts`     | メッセージテンプレート管理         |

### 使い分け

| 層                                      | 使うもの                                             |
| --------------------------------------- | ---------------------------------------------------- |
| ページ・コンポーネント・カスタムフック  | `ApplicationError` / `ApplicationErrorFactory`       |
| `src/features/*/service.ts`（サーバー） | `ApiError` のサブクラス（`BadRequestError` など）    |
| API ハンドラー                          | 例外を `throw` するだけ。`BaseApiHandler` が変換する |

---

## ApplicationError

```typescript
class ApplicationError extends Error {
  readonly code: string; // ErrorCodes のいずれか
  readonly originalError?: Error; // ラップした元のエラー
  getDetails(): { code: string; message: string; originalError?: string };
}
```

`new ApplicationError(...)` を直接呼ばず、`ApplicationErrorFactory` 経由で生成する。

### ApplicationErrorFactory

| メソッド                           | 用途                                                                                    |
| ---------------------------------- | --------------------------------------------------------------------------------------- |
| `create(code, message, original?)` | エラーコードとメッセージを指定して生成する                                              |
| `createFromResponse(response)`     | `Response` のステータスから生成する（5xx → `SERVER_ERROR`、4xx → `API_REQUEST_FAILED`） |
| `createNetworkError(original?)`    | 通信失敗時のエラーを生成する（`NETWORK_ERROR`）                                         |
| `normalize(error)`                 | `unknown` 型のエラーを `ApplicationError` に統一する                                    |

---

## エラーの投げ方

### 基本

```typescript
import { ApplicationErrorFactory } from "@/error/applicationError";
import { ErrorCodes } from "@/constants/errorCodes";
import { getMessage } from "@/constants/messages";

// シンプルなエラー
throw ApplicationErrorFactory.create(
  ErrorCodes.VALIDATION_ERROR,
  "バリデーションエラーが発生しました。",
);

// メッセージ定数を使う（推奨）
throw ApplicationErrorFactory.create(
  ErrorCodes.REQUIRED_FIELD_ERROR,
  getMessage("FIELD_IS_REQUIRED", { field: "チーム" }),
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

`normalize()` は `ApplicationError` をそのまま返し、`Error` は `UNKNOWN_ERROR` でラップして
元のエラーを `originalError` に保持する。文字列などそれ以外の値もメッセージとして取り込む。

---

## バリデーション

```typescript
import { ValidationErrorHandler } from "@/error/errorHandler";

// 必須チェック（null / undefined / 空文字 を弾く）
ValidationErrorHandler.validateRequired(value, "チーム名");

// 正の値チェック（0 以下を弾く）
ValidationErrorHandler.validatePositive(points, "ポイント");

// 最小値チェック
ValidationErrorHandler.validateMinValue(value, 1, "ポイント");

// 最大値チェック
ValidationErrorHandler.validateMaxValue(value, 100, "スコア");

// 範囲チェック
ValidationErrorHandler.validateRange(score, 0, 100, "スコア");
```

いずれも条件を満たさない場合に `ApplicationError` を `throw` する。
エラーコードは `validateRequired` が `REQUIRED_FIELD_ERROR`、それ以外は `VALUE_OUT_OF_RANGE_ERROR`。

---

## API 呼び出しのエラーハンドリング

```typescript
import {
  ApplicationError,
  ApplicationErrorFactory,
} from "@/error/applicationError";

try {
  const response = await fetch("/api/users");
  if (!response.ok) {
    throw ApplicationErrorFactory.createFromResponse(response);
  }
} catch (error) {
  if (error instanceof ApplicationError) {
    throw error; // 上位で処理
  }
  throw ApplicationErrorFactory.createNetworkError(
    error instanceof Error ? error : undefined,
  );
}
```

`fetch` 自体が失敗した場合（オフライン・DNS 失敗など）は `Response` が得られないため、
`createNetworkError()` に振り分ける。この二段構えにすることで、
「サーバーが返したエラー」と「そもそも到達しなかった」を利用者に区別して伝えられる。

---

## エラーログの出力

```typescript
import { ApplicationErrorHandler } from "@/error/errorHandler";

ApplicationErrorHandler.logError(appError, "PointsForm");
// → console.error("[PointsForm] VALIDATION_ERROR: ...", { code, message, originalError })
```

第 2 引数のコンテキストは任意。`originalError` があれば併せて出力される。

---

## メッセージテンプレート

`src/constants/messages.ts` の `Messages` 定数でメッセージを一元管理している。
プレースホルダーは `{変数名}` 形式で記述し、`getMessage` の第 2 引数で置換する。

メッセージは用途ごとにグループ化されている。

| グループ           | 例                                                               |
| ------------------ | ---------------------------------------------------------------- |
| 共通・認証         | `UNEXPECTED_ERROR` / `LOGIN_FAILED` / `PASSWORD_NOT_MATCH`       |
| バリデーション     | `FIELD_IS_REQUIRED` / `VALUE_MUST_BE_BETWEEN` / `INVALID_FORMAT` |
| API・通信          | `API_REQUEST_FAILED` / `NETWORK_ERROR` / `SERVER_ERROR`          |
| 登録・更新の結果   | `REGISTER_SUCCESS` / `UPDATE_FAILED`                             |
| ゲーム操作         | `ALREADY_PURCHASED` / `INSUFFICIENT_POINTS` / `STATION_MISMATCH` |
| 駅到着時の演出文言 | `PLUS_STATION_ARRIVAL` / `MISSION_STATION_ARRIVAL`               |

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

| コード                     | 用途                      |
| -------------------------- | ------------------------- |
| `UNKNOWN_ERROR`            | 不明なエラー              |
| `NETWORK_ERROR`            | ネットワークエラー        |
| `SERVER_ERROR`             | サーバーエラー（5xx）     |
| `VALIDATION_ERROR`         | 汎用バリデーションエラー  |
| `REQUIRED_FIELD_ERROR`     | 必須項目未入力            |
| `INVALID_FORMAT_ERROR`     | 入力形式不正              |
| `VALUE_OUT_OF_RANGE_ERROR` | 値が範囲外                |
| `DUPLICATE_ENTRY`          | 重複エントリ              |
| `API_REQUEST_FAILED`       | API リクエスト失敗（4xx） |

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
- サーバー側の `ApiError` をフロントエンドで直接 import しない。API のレスポンスから
  `createFromResponse()` で `ApplicationError` に変換して扱う
- エラーは握り潰さず、利用者に見せるダイアログか `ApplicationErrorHandler.logError()` のどちらかに必ず流す

## テスト

エラークラスのテストは `__tests__/error/` に配置する。詳細は
[docs/TESTING_GUIDE.md](TESTING_GUIDE.md) を参照。
