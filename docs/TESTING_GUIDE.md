# テストガイド

## 概要

このプロジェクトでは Jest + ts-jest でユニットテストを実装している。
テストは `__tests__/` 配下に `src/` のディレクトリ構成をミラーして配置する。

## 実行方法

```bash
npm test                  # 全テストを実行
npm test -- <パターン>     # ファイルパスで絞り込んで実行
npm run test:watch        # ウォッチモード
npm run test:coverage     # カバレッジ付きで実行
```

DB や外部サービスへの接続は不要。すべてモックで完結するため、環境変数の設定なしに実行できる。

## ディレクトリ構成

```
__tests__/
├── helpers/                        # テスト用のヘルパー（テスト対象ではない）
│   ├── factories.ts                # Prismaモデルのテストデータファクトリ
│   ├── repositoryMocks.ts          # RepositoryFactoryのモックヘルパー
│   └── apiRequest.ts               # APIハンドラー層のリクエスト/レスポンスヘルパー
├── app/api/<endpoint>/             # APIハンドラー層
├── features/<feature>/             # Service層
├── utils/                          # ユーティリティ
└── error/                          # エラークラス
```

`testMatch` は `**/__tests__/**/*.test.ts` のため、`helpers/` 配下のファイルはテストとして実行されない。

## 各層のテスト方針

### utils（最優先）

外部依存のない純粋関数。モックなしで入出力を直接検証する。
ゲームロジックの境界値（連続ゴール数、駅数、ポイントの過不足など）を厚めに確認する。

```ts
/**
 * @jest-environment node
 */
import { GameLogicUtils } from "@/utils/gameLogicUtils";

it("連続ゴール数が1回のときはボーナスなし", () => {
    expect(GameLogicUtils.calculateConsecutiveGoalBonusV3(1)).toBe(0);
});
```

DOM を使わないテストには `@jest-environment node` を指定する（jsdom の起動コストを避けるため）。

### Service（高優先）

Service は `RepositoryFactory.get*Repository()` で Repository を取得するため、
`mockRepositories()` で Factory の getter をモックに差し替える。

```ts
import { mockRepositories, mockWithTransaction } from "../../helpers/repositoryMocks";

beforeEach(() => {
    const findByEventCode = jest.fn().mockResolvedValue([]);
    mockRepositories({ propertyPurchases: { findByEventCode } });
    mockWithTransaction(); // トランザクション内の処理をそのまま実行させる
});

afterEach(() => {
    jest.restoreAllMocks(); // spyを必ず戻す
});
```

検証する観点:

- 正常系のデータ組み立て
- 業務エラー（`ConflictError` / `BadRequestError` など）を投げる分岐と、その境界値
- 想定外のエラーが `InternalServerError` に変換され、`ApiError` はそのまま再スローされること
- 書き込みが同一トランザクション（`mockWithTransaction()` の戻り値）で実行されていること

### Repository（高優先）

Repository は `BaseRepository` のサブクラスとして `PrismaClient` を注入されるため、
使用するモデル・メソッドだけを持つモッククライアントを作って渡す。

```ts
const prisma = {
    points: {
        findMany: jest.fn(),
        create: jest.fn(),
    },
} as unknown as PrismaClient;

const repository = new PointsRepository(prisma);
```

検証する観点:

- `where` / `include` / `orderBy` など Prisma に渡すクエリ条件が期待通りであること
- トランザクションクライアント（`tx`）を引数で渡した場合、通常の `this.prisma` ではなく
  `tx` 側が使われること
- 集計結果が `null`（該当レコードなし）の場合に `0` へ変換されるなど、Prisma の戻り値を
  そのまま返していない加工ロジック
- DB エラー発生時に `handleDatabaseError` 経由でエラーメッセージが変換されること
  （個別の Repository では代表的な1パターンを確認すれば十分。分岐の網羅は
  `BaseRepository` 自体のテストで行う）

`BaseRepository` の `executeTransaction` / `handleDatabaseError` は、テスト用の
具象サブクラスを作って直接検証する（`__tests__/repositories/base/BaseRepository.test.ts`）。

### APIハンドラー（中優先）

各ハンドラーはコンストラクタで Service を差し替えられる。モックの Service を注入して
`handle()` の結果を検証する。

```ts
const service = { getXxx: jest.fn() } as unknown as jest.Mocked<XxxService>;
const { status, body } = await readResponse(await new XxxApiHandler(req, service).handle());
```

検証する観点:

- リクエストのバリデーション失敗 → 400（Service が呼ばれないこと）
- Service が投げた `ApiError` のステータスコードが引き継がれること
- 想定外のエラーが 500 になり、内部のエラーメッセージが漏れないこと
- 未対応の HTTP メソッド → 405

一部の古いハンドラー（例: `PointsApiHandler`）はコンストラクタで Service を注入できず、
`XxxServiceImpl` をモジュールレベルで直接 import して呼び出している。この場合は
`jest.mock("@/features/xxx/service")` でモジュールごとモックに差し替える。

```ts
jest.mock("@/features/points/service", () => ({
    PointsServiceImpl: { getPointsByEventCodeGroupedByTeamCode: jest.fn(), /* ... */ },
}));
const { PointsServiceImpl } = jest.requireMock("@/features/points/service");
// jest.mockの巻き上げにより、モック定義後でも問題なくハンドラーをimportできる
import PointsApiHandler from "@/app/api/points/PointsApiHandler";
```

`route.ts` は `createApiHandler` に渡すだけの薄いラッパーのため、個別のテストは不要。

### テストデータ

Prisma のモデルは必須カラムが多いため、`helpers/factories.ts` のファクトリを使い、
検証に関係する項目だけを override する。

```ts
buildStation({ stationType: StationType.plus, stationGrade: StationGrade.a });
```

## 書き方の指針

### 1. 誤った挙動をテストで固定しない

既存実装にバグを見つけた場合、その挙動を正解として `expect` に書かない。
`it.failing` で「本来あるべき挙動」を書き残し、コメントで理由を説明する。
修正されるとこのテストは失敗するため、`.failing` を外す契機になる。

```ts
// FIXME 兆の桁の除数が10^11になっており、正しい10^12に対して10倍ずれている。
it.failing("兆の単位が繰り上がる", () => {
    expect(Converter.convertPointsToYen(10_000_000)).toBe("1 兆 0 万");
});
```

### 2. 境界値は両側から挟む

「ちょうど足りる」だけを確認すると、値が過大に計算されていても検出できない。
「ちょうど足りる」と「1つ足りない」の両方を確認する。

### 3. 乱数は固定する

`Math.random` を使うロジックは `jest.spyOn(Math, "random").mockReturnValue(...)` で固定する。
確率分布そのものの検証は、テストではなく `tools/roulette-*` のシミュレーターで行う。

### 4. テスト名は仕様として読めるようにする

「何をしたら」「どうなるか」を日本語で書く。`it.each` を使う場合は、
プレースホルダ（`%s` / `%i`）と引数の順序が一致していることを確認する
（ずれると `NaN` などがテスト名に出る）。

## テストではないもの

実行のたびに結果が変わる検証スクリプトや、DB 接続を前提とした分析ツールは
テストではなく `tools/` 配下に置き、`npx tsx` で直接実行する。

- `tools/roulette-weighted-station-simulator/` : 目的駅ルーレットのシミュレーション
- `tools/roulette-probability-analyzer/` : 目的駅の出現確率の分析
