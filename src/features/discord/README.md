# Discord通知

通知は登録APIのサービス層から送信する。ブラウザは登録APIを呼ぶだけで、通知の追加リクエストは行わない。

## 実行順序

1. Prismaの登録処理をawaitする。複数レコードの場合はトランザクションのコミット完了まで待つ。
2. notifications.tsでイベント設定を取得し、登録結果を基に通知内容と宛先を確定する。
3. Next.jsのafter()に送信処理を予約する。通知予約はRealtime通知・レスポンス生成より先に行う。
4. サーバーの応答処理終了後にDiscordへ送信する。クライアントの受信成功や画面遷移に依存しない。

準備・予約・送信に失敗しても確定済みの登録結果は変更しない。失敗はサーバーログへ記録し、通知ごとに隔離する。自動再送や永続キューはなく、実行時間はホスティング環境の制限に従う。

## 通知条件

すべての通知はEvents.isNotificationEnabledがtrueの場合だけ送る。

| 操作 | 通知条件・宛先 | テンプレート |
| --- | --- | --- |
| 目的駅登録（v02・v03） | 登録確定後、Events.discordWebhookUrlへ | registerGoalStation.txt |
| ボンビー設定（手動・自動） | 履歴登録確定後、Events.discordWebhookUrlへ | registerBombii.txt |
| 現在地登録（v02・v03） | 登録確定後に取得した最新目的駅と登録駅が一致した場合、Events.discordWebhookUrlへ | arrivalGoalStation.txt |
| 現在地登録（v03）の収益 | 登録ポイントと物件所有チームのWebhookが存在する場合、そのチームへ | earnRevenue.txt |
| 現在地登録（v03）の収益支払い | 登録ポイントと到着したチームのWebhookが存在する場合、そのチームへ | payRevenue.txt |

宛先Webhookが未設定の場合、その通知は送らない。収益・支払い通知はイベントWebhookの有無とは独立しており、互いの宛先の有無にも依存しない。金額は所有チームに登録された収益ポイントをConverter.convertPointsToYenV3で変換する（支払い側も同額）。到着したチームのWebhookは通知準備時にTeamsから取得する。

目的駅到着通知は現在地登録の時点で発生する。到着報酬の確定処理には移動しない。同じ駅の再登録時も既存条件どおり判定し、新たな重複抑制は加えない。

## 構成

- notifications.ts: サーバー専用の通知判定・内容確定・バックグラウンド実行予約。
- notify/service.ts: サーバー内部の送信サービス。送信結果をsuccessで返す。
- src/utils/discordUtils.ts: テンプレート読み込み・変数置換・Webhookへの送信。
- src/templates/discord/: 既存の文面。{{変数名}}を駅名・チーム名・金額などで置換する。
- next.config.ts: 5つの登録APIの本番成果物へテキストテンプレートを同梱する。

通知設定・Webhook URLはDBを使用する。通知用の環境変数設定は不要。

`POST /api/discord/notify`と`useDiscordNotification`は廃止した。`POST /api/current-location-v3`のレスポンスにも`teamDiscordWebhookUrl`を含めない。新しい通知を追加するときは、コミット完了後にnotifications.tsの処理を呼び、トランザクション内やクライアントから送信しない。

## 検証

__tests__/features/discord/notifications.test.tsで、各登録サービスと通知処理を接続した状態でコミット前・失敗時の非通知、設定、宛先、文面変数、通知失敗の隔離を検証する。Next.jsのafter()はキューとしてモックし、登録APIの完了とは別にコールバックを実行する。

実行方法は[テストガイド](../../../docs/TESTING_GUIDE.md)、画面での確認方法は[Storybookガイド](../../../docs/STORYBOOK_GUIDE.md#discord通知移行後のフォーム試験)を参照。
