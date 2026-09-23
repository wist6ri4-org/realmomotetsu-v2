# Storybook ガイド

## 概要

このプロジェクトでは Storybook を次の2つの目的で使用している。

1. **コンポーネントカタログ化**: `src/components/` 配下の UI コンポーネントを一覧・単体確認できるようにする。
2. **画面レベル（結合）試験の自動化**: v03 の主要画面（home / form / roulette / operation/tools）を、
   実際のページコンポーネントに MSW でモックした API を差し込んで動かし、play function で自動検証する。

Jest によるユニットテスト（[docs/TESTING_GUIDE.md](TESTING_GUIDE.md)）とは別系統で、UI・画面の振る舞いを対象とする。

## 見る・動かす

### 1. ブラウザでカタログを見る（開発中に一番使う）

```bash
npm run storybook
```

`http://localhost:6006` が起動する。左サイドバーに `Base/` `Composite/` `Composite/Form/` `Screens/V03/`
というツリーでコンポーネント・画面が並ぶ。

- 各 story をクリックすると実際にレンダリングされたものが表示される。
- 右下の **Controls** パネルで props をその場で変更できる。
- play function を持つ story は、右下の **Interactions** パネルで自動操作・アサーションの
  ステップを1つずつ確認できる（失敗した場合はどのステップで失敗したかもここでわかる）。
- **Docs** タブでは autodocs（`tags: ["autodocs"]`）により props の型・説明が自動生成される。

### 2. play function を含めて自動実行する（CIや動作確認用）

```bash
npm run test:storybook
```

全 story の play function を Playwright（Chromium）のブラウザ上で実際に実行し、
pass/fail を一括で CLI 出力する。実体は Vitest のブラウザモード（`vitest.config.ts`）。

```bash
npx vitest run <ファイルパスの一部>   # 特定のstoryファイルだけ実行
npx vitest run --project=storybook -t "<story名>"   # story名で絞り込み
```

### 3. 静的ビルドする（配布・デプロイ用）

```bash
npm run build-storybook
```

`storybook-static/`（Git管理外）に静的サイトが出力される。現時点では CI には組み込んでおらず、
必要になったときにデプロイ先を用意する想定。

### 初回セットアップ

```bash
npx playwright install chromium   # test:storybook がPlaywrightのブラウザを使うため、初回のみ
```

`npm run storybook` / `build-storybook` / `test:storybook` はいずれも内部で `prisma generate` を
実行してから起動するため、それ以外の準備は不要（`npm install` 時に `patch-package` のパッチも
`postinstall` で自動適用される）。

## ディレクトリ構成・配置ルール

```
.storybook/
├── main.ts       # Storybookの設定（stories glob、addon、Vite設定への差し込み）
└── preview.tsx    # グローバルデコレーター（ThemeRegistry / UserIconProvider）、MSW loader、
                    # geolocationスタブなど

src/components/**/*.stories.tsx   # コンポーネントのstory。実装ファイルと同じディレクトリに同居させる
src/stories/
├── mocks/
│   ├── fixtures.ts   # __tests__/helpers/factories.ts のfactoryを再exportしつつ、
│   │                  # EventWithRelations / UsersWithRelations 等の追加ビルダーを提供
│   └── handlers.ts   # エンドポイントごとのMSWハンドラーファクトリ（success/empty/error/delayed）
└── screens/
    ├── helpers/MockEventProvider.tsx   # EventContextに直接fixtureを注入するテスト用プロバイダー
    └── v03/*.stories.tsx               # 画面レベル（結合）試験のstory
```

- **コンポーネントのstory**は実装ファイルの隣に置く（`CustomButton.tsx` → `CustomButton.stories.tsx`）。
- **画面レベルのstory**は `src/stories/screens/` にまとめる。実際の `EventsLayout`
  （認証ガード・ApplicationBar等）は経由せず、ページコンポーネントを `MockEventProvider` で
  直接ラップして描画する。

## story の書き方

### コンポーネントstoryの基本形

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import CustomButton from "./CustomButton";

const meta = {
  title: "Base/CustomButton",
  component: CustomButton,
  tags: ["autodocs"],
  args: { children: "ボタン", onClick: fn() },
} satisfies Meta<typeof CustomButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** クリック操作の検証。play functionでクリックしonClickが呼ばれることを確認する。 */
export const Clickable: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "ボタン" }));
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
```

- fixture が必要な props（`Teams[]` / `Stations[]` 等）は `src/stories/mocks/fixtures.ts` の
  `build*` 関数（`__tests__/helpers/factories.ts` 由来）を再利用する。
- `EventContext` に依存するコンポーネント（`ApplicationBar` / `NavigationBar` / `RoutemapDialog` 等）は
  `MockEventProvider` でラップする。`next/navigation` の `useParams` に値を渡したい場合は
  `parameters.nextjs.navigation.segments`（`[["eventCode", "TEST_EVENT"]]` のような `[key, value]` の配列）、
  `usePathname` に渡したい場合は `parameters.nextjs.navigation.pathname` を使う。
- `fetch` を伴うコンポーネント（フォーム等）は `src/stories/mocks/handlers.ts` のハンドラーファクトリを
  `parameters.msw.handlers` に渡す。`success` / `empty` / `error(status, message)` / `delayed(data, ms)`
  の4種類がある。

```tsx
parameters: {
  msw: {
    handlers: { registerPoints: pointsHandlers.success({}) },
  },
},
```

`parameters.msw.handlers` は **Record（キー付きオブジェクト）** で渡す。Storybook の
`parameters` は配列だとstory側の値で完全に置き換わるが、objectのキーはマージされるため、
`.storybook/preview.tsx` のグローバルなデフォルトハンドラー（`default` キー）を残したまま
story固有のハンドラーだけ追加・上書きできる。

### 画面レベル（結合）storyの基本形

```tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";
import HomePage from "@/app/events/v03/[eventCode]/home/page";
import { MockEventProvider } from "@/stories/screens/helpers/MockEventProvider";
import { buildTeam } from "@/stories/mocks/fixtures";
import { initHomeHandlers } from "@/stories/mocks/handlers";

const meta = {
  title: "Screens/V03/Home",
  component: HomePage,
  decorators: [
    (Story) => (
      <MockEventProvider value={{ teams: [buildTeam()] }}>
        <Story />
      </MockEventProvider>
    ),
  ],
  parameters: {
    nextjs: { navigation: { segments: [["eventCode", "TEST_EVENT"]] } },
  },
} satisfies Meta<typeof HomePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Data: Story = {
  parameters: {
    msw: { handlers: { initHome: initHomeHandlers.success({ teamData: [...], nextGoalStation: null, bombiiTeam: null }) } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText("チームA")).toBeInTheDocument());
  },
};
```

- ローディング状態はページ側のマウント直後に一瞬しか出ないことが多いため、データ表示の
  アサーションは `findBy*` / `waitFor` で待つ（`getBy*` だと早すぎて失敗する）。
- 同一ラベルのフィールドが画面内に複数存在する場合（例: operation/tools 画面の「チーム」セレクトが
  フォームごとに複数ある）は、`canvas.getByText("見出し文言")` を起点に
  `.closest(".MuiBox-root")?.parentElement` でそのフォームのDOM範囲に絞り込んでから操作する。
- 複数のダイアログが連続して開く（確認 → 完了 → 種別別の追加ダイアログ、等）フローでは、
  `getByText` より `getByRole("heading", { name })` の方が確実にマッチする
  （MUI の `DialogTitle` を挟んだ text ノードの分割で `getByText` が失敗することがある）。

## 既知の注意点

- `@storybook/addon-vitest`（v10.6.0時点）には、Windowsでのパス区切り文字の扱いおよび
  非ASCIIパス（日本語ディレクトリ名等）のURLデコードに起因して story がテストとして
  認識されない・実行されないバグがある。`patches/@storybook+addon-vitest+10.6.0.patch`
  （`patch-package`、`postinstall` で自動適用）で回避している。バージョンを上げる際は、
  まず `npx vitest run` が正常に動くか確認し、直っていればパッチと `package.json` の
  `postinstall` を削除してよい。
- `src/lib/supabase.ts` の Supabase クライアント初期化は `.storybook/main.ts` の `env` 設定で
  ダミーの環境変数を注入して通しているため、Storybook 上では実際の Supabase 通信は行われない。
  `useRealtimeRefresh` 経由の Realtime WebSocket 接続エラーがコンソールに出ることがあるが無害。
- `@/generated/prisma`（Prismaクライアントの生成物）はプロジェクト内ローカルファイル（CommonJS）で
  あるため、Viteの既定動作では named export が正しく解決できない。`vitest.config.ts` /
  `.storybook/main.ts` の `resolve.alias` + `optimizeDeps.include` で回避している。
- `TeamCard` / `TeamCardV3` / `Routemap` は、対象チームの `transitStations` が空だと
  実装側がクラッシュする（`lastStation.createdAt` 等を null チェックなしで参照している）。
  各storyのコメント参照。story追加時は経由駅履歴を持つチームをfixtureにする。
- `isOpen`のような開閉propを持つ、内部stateを持たない「完全制御されたダイアログ」
  （`AlertDialog` / `ConfirmDialog` / `GoalDialog` / `TransitStationsHistoryDialog`）は、
  `args`で常時open（`isOpen: true`等）にしてはいけない。MUIの`Dialog`はPortalで
  `document.body`直下に`position: fixed`のバックドロップを描画するため、autodocs（Docsページ）
  では story canvasとControls表が同じdocumentを共有しており、バックドロップがページ全体
  （Controls表を含む）を覆ってしまう。
  - 対策として`meta.parameters.docs.story.inline: false`（Docsページの埋め込みcanvasを
    独立したiframeに分離する）を試したが、これは**Docsページ上のControlsからの値変更が
    その埋め込みcanvasに一切反映されなくなる**（Storybookの`@storybook/addon-docs`の
    channel実装上の制約）という別の問題を生むため不採用とした。
  - 採用した解決策: `meta.render`で開閉状態を**story側のローカルstate**として持ち、
    「ダイアログを開く」ボタン（`CustomButton`）→クリックで実際に開く→ダイアログ内の
    ボタンで実際に閉じる、という実アプリと同じ操作感をstory自体で再現する
    （`AlertDialog.stories.tsx`等を参照）。`args`の開閉propは`false`固定にし、
    `argTypes`で`table: { disable: true }`にしてControlsから非表示にする
    （ローカルstateで上書きされるため、Controlsで操作しても反映されず紛らわしいため）。
    この方式なら常にDocsページは安全（閉じた状態）に保たれ、かつCanvas・Docsどちらでも
    実際にクリックして開閉を確認できる。
  - 開閉propを持たず内部stateのFabトリガーで開閉する`InformationDialog` / `RoutemapDialog`は
    元々この問題が起きないため対象外。同じ形のダイアログ系コンポーネントを追加する場合は、
    上記のローカルstateパターンを踏襲すること。
  - play functionで閉じる操作を検証する際、MUIのDialogは閉じるときにexit transition
    （フェードアウト、既定約200ms）を伴うため、`queryByText(...).not.toBeInTheDocument()`は
    即座に判定せず`waitFor(() => expect(...).not.toBeInTheDocument())`で待つこと
    （即時評価だとtransition中の古いDOMが残っていて失敗する）。
