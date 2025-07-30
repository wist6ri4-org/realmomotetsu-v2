# DiscDiscord 通知機能は以下の特徴を持ちます：

-   **テンプレートベース**: JSON またはテキストファイルのテンプレートを使用して通知内容を管理
-   **変数置換**: テンプレート内で変数（`{{変数名}}`）を使用して動的な内容を挿入
-   **Embed 対応**: Discord の埋め込みメッセージ（rich embed）をサポート
-   **キャッシュ機能**: テンプレートファイルをメモリにキャッシュして性能を向上
-   **シングルトンパターン**: アプリケーション全体で一つの DiscordNotifier インスタンスを共有
-   **通知制御**: 環境変数による通知の有効/無効の切り替えが可能能

このプロジェクトでは、Discord の webhook 機能を使用して通知を送信する機能が実装されています。

## 概要

Discord 通知機能は以下の特徴を持ちます：

-   **テンプレートベース**: JSON またはテキストファイルのテンプレートを使用して通知内容を管理
-   **変数置換**: テンプレート内で変数（`{{変数名}}`）を使用して動的な内容を挿入
-   **Embed 対応**: Discord の埋め込みメッセージ（rich embed）をサポート
-   **キャッシュ機能**: テンプレートファイルをメモリにキャッシュして性能を向上
-   **シングルトンパターン**: アプリケーション全体で一つの DiscordNotifier インスタンスを共有

## アーキテクチャ

```
src/
├── features/discord/notify/          # Discord通知のビジネスロジック
│   ├── interface.ts                  # サービスインターフェース
│   ├── service.ts                   # サービス実装
│   ├── types.ts                     # 型定義
│   └── validator.ts                 # リクエストバリデーション
├── app/api/discord/notify/          # APIエンドポイント
│   ├── route.ts                     # APIルート定義
│   └── DiscordNotifyApiHandler.ts   # APIハンドラー
├── utils/discordUtils.ts            # Discord通知のコアロジック
├── hooks/useDiscordNotification.ts  # フロントエンド用フック
└── templates/discord/               # 通知テンプレート
    ├── *.json                       # 埋め込みメッセージ用テンプレート
    └── *.txt                        # シンプルテキスト用テンプレート
```

## 設定

### 1. 環境変数

`.env.local` または `.env` ファイルに以下の環境変数を設定してください：

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
ENABLE_DISCORD_NOTIFICATIONS=true
```

#### 環境変数の説明

-   `DISCORD_WEBHOOK_URL`: Discord の Webhook URL（必須）
-   `ENABLE_DISCORD_NOTIFICATIONS`: Discord 通知の有効/無効を制御（オプション、デフォルト: false）
    -   `true`: Discord 通知を有効にする
    -   `false`: Discord 通知を無効にする（通知は送信されない）

### 2. Webhook URL の取得方法

1. Discord サーバーの設定 → 連携サービス → ウェブフック
2. 「新しいウェブフック」をクリック
3. 名前とチャンネルを設定
4. 「ウェブフック URL をコピー」で URL を取得

## テンプレートシステム

### テンプレートの種類

#### 1. JSON テンプレート（埋め込みメッセージ用）

ファイル名: `src/templates/discord/example.json`

```json
{
    "content": "通常のメッセージ内容（オプション）",
    "embed": {
        "title": "{{title}}",
        "description": "{{description}}",
        "color": 5763719,
        "fields": [
            {
                "name": "フィールド名",
                "value": "{{fieldValue}}",
                "inline": true
            }
        ]
    }
}
```

#### 2. テキストテンプレート（シンプルメッセージ用）

ファイル名: `src/templates/discord/example.txt`

```txt
@everyone
お知らせです！
{{message}}
```

### 変数置換

テンプレート内で `{{変数名}}` の形式で変数を定義できます。送信時に実際の値に置換されます。

## 使用方法

### 1. バックエンド（サーバーサイド）での使用

```typescript
import { getDiscordNotifier, isDiscordNotificationEnabled } from "@/utils/discordUtils";

// Discord通知が有効かどうかを確認
if (isDiscordNotificationEnabled()) {
    // 通知を送信
    const notifier = getDiscordNotifier();

    // JSONテンプレートを使用
    await notifier.sendNotification("api-success", {
        endpoint: "/api/example",
        timestamp: new Date().toISOString(),
        user: "田中太郎",
    });

    // テキストテンプレートを使用
    await notifier.sendNotification(
        "registerGoalStation.txt",
        {
            stationName: "東京駅",
        },
        true
    ); // 第3引数でテキストテンプレートを指定

    // シンプルなメッセージを送信
    await notifier.sendSimpleMessage("システムが正常に起動しました");
} else {
    console.log("Discord通知は無効になっています");
}
```

#### エラーハンドリングを含む使用例

```typescript
import { getDiscordNotifier } from "@/utils/discordUtils";

try {
    const notifier = getDiscordNotifier();
    await notifier.sendNotification("api-success", {
        endpoint: "/api/example",
        timestamp: new Date().toISOString(),
        user: "田中太郎",
    });
    console.log("通知が送信されました");
} catch (error) {
    if (error instanceof Error && error.message.includes("Discord notifications are not enabled")) {
        console.log("Discord通知は無効になっています");
    } else {
        console.error("通知の送信に失敗しました:", error);
    }
}
```

### 2. フロントエンド（クライアントサイド）での使用

#### React フックの使用

```typescript
import { useDiscordNotification } from "@/hooks/useDiscordNotification";

function MyComponent() {
    const { sendNotification, isLoading, error, clearError } = useDiscordNotification();

    const handleNotify = async () => {
        try {
            const result = await sendNotification({
                templateName: "api-success",
                variables: {
                    endpoint: "/api/example",
                    timestamp: new Date().toISOString(),
                    user: "田中太郎",
                },
            });

            if (result.success) {
                console.log("通知が送信されました");
            }
        } catch (err) {
            console.error("通知の送信に失敗しました:", err);
        }
    };

    return (
        <div>
            <button onClick={handleNotify} disabled={isLoading}>
                {isLoading ? "送信中..." : "Discord通知"}
            </button>
            {error && (
                <p style={{ color: "red" }}>
                    エラー: {error}
                    <button onClick={clearError}>クリア</button>
                </p>
            )}
        </div>
    );
}
```

#### API を直接呼び出す場合

```typescript
const response = await fetch("/api/discord/notify", {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify({
        templateName: "api-success",
        variables: {
            endpoint: "/api/example",
            timestamp: new Date().toISOString(),
            user: "田中太郎",
        },
    }),
});

const result = await response.json();
console.log(result); // { success: true } または { success: false }
```

## API エンドポイント

### POST `/api/discord/notify`

Discord 通知を送信します。

#### リクエストボディ

```typescript
{
    templateName: string;           // テンプレート名（拡張子含む）
    variables?: Record<string, string>; // 変数の値（オプション）
}
```

#### レスポンス

```typescript
{
    success: boolean; // 送信成功フラグ
}
```

#### 例

```bash
curl -X POST http://localhost:3000/api/discord/notify \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "api-success",
    "variables": {
      "endpoint": "/api/test",
      "timestamp": "2024-01-01T12:00:00Z",
      "user": "テストユーザー"
    }
  }'
```

## 既存のテンプレート

現在利用可能なテンプレート：

### JSON テンプレート

-   `api-success.json` - API 実行成功通知
-   `api-error.json` - API エラー通知

### テキストテンプレート

-   `registerGoalStation.txt` - 目的地登録通知
-   `registerBombii.txt` - ボンビー登録通知
-   `arrivalGoalStation.txt` - 目的地到着通知
-   `arrival.txt` - 到着通知

## エラーハンドリング

### 一般的なエラー

1. **Discord 通知が無効になっている**

    ```
    Discord notifications are not enabled. Set ENABLE_DISCORD_NOTIFICATIONS to true.
    ```

2. **DISCORD_WEBHOOK_URL が設定されていない**

    ```
    Discord notifier not initialized. Call initializeDiscordNotifier first.
    ```

3. **テンプレートファイルが見つからない**

    ```
    Failed to load JSON template "example": ENOENT: no such file or directory
    ```

4. **Discord API エラー**
    ```
    Discord API error: 400 Bad Request
    ```

### エラーの対処法

-   環境変数が正しく設定されているか確認
    -   `DISCORD_WEBHOOK_URL`が設定されている
    -   `ENABLE_DISCORD_NOTIFICATIONS=true`が設定されている
-   テンプレートファイルのパスと名前が正しいか確認
-   Webhook URL が有効で、権限が適切に設定されているか確認
-   テンプレートの JSON 形式が正しいか確認

## 開発時の注意点

### 1. テンプレートキャッシュ

テンプレートファイルは初回読み込み時にメモリにキャッシュされます。開発中にテンプレートを変更した場合は、サーバーを再起動してください。

### 2. 変数の型安全性

現在、変数はすべて `string` 型として扱われます。数値や真偽値を使用する場合は、テンプレート内で適切にフォーマットしてください。

### 3. Discord の制限

-   メッセージの最大長: 2000 文字
-   埋め込みメッセージのタイトル: 256 文字
-   埋め込みメッセージの説明: 4096 文字
-   フィールド数: 最大 25 個

## 拡張方法

### 新しいテンプレートの追加

1. `src/templates/discord/` ディレクトリに新しいファイルを作成
2. JSON またはテキスト形式でテンプレートを記述
3. 必要に応じて変数 `{{変数名}}` を使用

### カスタムサービスの作成

独自のビジネスロジックを実装する場合：

```typescript
import { getDiscordNotifier } from "@/utils/discordUtils";

export class CustomNotificationService {
    async sendCustomNotification(data: CustomData) {
        const notifier = getDiscordNotifier();

        // カスタムロジック
        const variables = this.prepareVariables(data);

        await notifier.sendNotification("custom-template", variables);
    }

    private prepareVariables(data: CustomData): Record<string, string> {
        // データを変数に変換するロジック
        return {
            // ...
        };
    }
}
```

## トラブルシューティング

### よくある問題と解決策

1. **通知が送信されない**

    - `ENABLE_DISCORD_NOTIFICATIONS=true`が設定されているか確認
    - ネットワーク接続を確認
    - Webhook URL が正しいか確認
    - Discord サーバーで Webhook が有効になっているか確認

2. **テンプレートが見つからない**

    - ファイルパスが正しいか確認
    - ファイル名の大文字小文字を確認
    - ファイルの存在を確認

3. **変数が置換されない**

    - 変数名のスペルを確認
    - 変数の形式が `{{変数名}}` になっているか確認

4. **通知機能を一時的に無効にしたい**
    - `.env`ファイルで`ENABLE_DISCORD_NOTIFICATIONS=false`に設定
    - アプリケーションを再起動（環境変数の変更を反映）

## ライセンス

この Discord 通知機能は、プロジェクトのライセンスに従います。
