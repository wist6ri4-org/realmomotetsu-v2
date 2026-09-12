# テストガイド

## 概要

このプロジェクトでは Jest + ts-jest でユニットテストを実装している。
テストは `__tests__/` 配下に `src/` のディレクトリ構成をミラーして配置する。

## 実行方法

```bash
npm test                  # 全テストを実行
npm test -- <パターン>     # ファイルパスで絞り込んで実行
npm run test:watch        # ウォッチモード
npm run test:coverage     # カバレッジ付きで実行（coverage/ に出力、Git管理外）
```

DB や外部サービスへの接続は不要。すべてモックで完結するため、環境変数の設定なしに実行できる。

## 設定

`jest.config.js` の主な設定は以下のとおり。

| 設定                  | 値                                                                                                             |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `testEnvironment`     | `jsdom`（各ファイルの docblock で `node` に上書き可）                                                          |
| `testMatch`           | `**/__tests__/**/*.test.[jt]s?(x)`                                                                             |
| `moduleNameMapper`    | `@/*` → `src/*`                                                                                                |
| `setupFilesAfterEnv`  | `jest.setup.js`（`@testing-library/jest-dom` を読み込む）                                                      |
| `collectCoverageFrom` | `src/utils/`、`src/features/**/service.ts`、`src/repositories/`、`src/app/api/**/*ApiHandler.ts`、`src/error/` |

カバレッジ対象はビジネスロジックを持つ層に絞っている。UI コンポーネントは対象外。

## ディレクトリ構成

```
__tests__/
├── helpers/                        # テスト用のヘルパー（テスト対象ではない）
│   ├── factories.ts                # Prismaモデルのテストデータファクトリ
│   ├── repositoryMocks.ts          # RepositoryFactoryのモックヘルパー
│   ├── prismaMock.ts               # PrismaClient / トランザクションクライアントのモック
│   └── apiRequest.ts               # APIハンドラー層のリクエスト/レスポンスヘルパー
├── app/api/<endpoint>/             # APIハンドラー層
│   └── utils/                      # BaseApiHandler / createApiHandler / LogService
├── features/<feature>/             # Service層
├── repositories/<model>/           # Repository層
│   └── base/                       # BaseRepository
├── utils/                          # ユーティリティ
└── error/                          # エラークラス
```

`testMatch` は `*.test.ts(x)` のため、`helpers/` 配下のファイルはテストとして実行されない。

テストファイルは実装ファイルと 1 対 1 で対応させる。
たとえば `src/features/points/service.ts` に対して `__tests__/features/points/service.test.ts`、
`src/app/api/points/PointsApiHandler.ts` に対して `__tests__/app/api/points/PointsApiHandler.test.ts` を置く。

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
import {
  mockRepositories,
  mockWithTransaction,
} from "../../helpers/repositoryMocks";

beforeEach(() => {
  const findByEventCode = jest.fn().mockResolvedValue([]);
  mockRepositories({ propertyPurchases: { findByEventCode } });
  mockWithTransaction(); // トランザクション内の処理をそのまま実行させる
});

afterEach(() => {
  jest.restoreAllMocks(); // spyを必ず戻す
});
```

トランザクションが失敗するケースは `mockWithTransactionFailure(error)` で再現する。
スローされたエラーの型と中身を検証するときは `captureError(promise)` を使うと、
`try-catch` を書かずに投げられた値を取り出せる。

検証する観点:

- 正常系のデータ組み立て
- 業務エラー（`ConflictError` / `BadRequestError` など）を投げる分岐と、その境界値
- 想定外のエラーが `InternalServerError` に変換され、`ApiError` はそのまま再スローされること
- 書き込みが同一トランザクション（`mockWithTransaction()` の戻り値）で実行されていること

### Repository（高優先）

Repository は `BaseRepository` のサブクラスとして `PrismaClient` を注入されるため、
`jest-mock-extended` の `mockDeep<PrismaClient>()` でモック化したクライアントを渡す。
ヘルパーとして `__tests__/helpers/prismaMock.ts` の `createPrismaMock()` /
`createPrismaTransactionMock()` を使う。

```ts
import { createPrismaMock, MockPrismaClient } from "../../helpers/prismaMock";

let prisma: MockPrismaClient;
let repository: PointsRepository;

beforeEach(() => {
  prisma = createPrismaMock();
  repository = new PointsRepository(prisma);
});

it("...", async () => {
  prisma.points.findMany.mockResolvedValue(points);
  // ...
});
```

`mockDeep` は全メソッドを自動でモック化するため、使わないメソッドの定義漏れを
気にする必要がない。`groupBy` / `aggregate` など戻り値の型が厳密で合わせづらい場合は
`mockResolvedValue(value as never)` のようにキャストしてよい。

トランザクションクライアント（`tx`）を検証する場合は `createPrismaTransactionMock()` で
別のモックを用意し、tx指定時にそちらが呼ばれ、通常の `prisma` 側は呼ばれないことを確認する。

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
`RepositoryFactory` は各 getter が対応する Repository を返すことを
`__tests__/repositories/RepositoryFactory.test.ts` で確認する。

### APIハンドラー（中優先）

各ハンドラーはコンストラクタで Service を差し替えられる。モックの Service を注入して
`handle()` の結果を検証する。リクエストとレスポンスの組み立ては
`helpers/apiRequest.ts` の `buildGetRequest` / `buildPostRequest` / `buildRequestWithMethod` /
`readResponse` を使う。

```ts
import {
  buildGetRequest,
  readResponse,
  silenceApiLogs,
} from "../../helpers/apiRequest";

beforeEach(() => silenceApiLogs()); // アクセスログでテスト出力が埋まるのを防ぐ

const service = { getXxx: jest.fn() } as unknown as jest.Mocked<XxxService>;
const { status, body } = await readResponse(
  await new XxxApiHandler(req, service).handle(),
);
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
  PointsServiceImpl: {
    getPointsByEventCodeGroupedByTeamCode: jest.fn() /* ... */,
  },
}));
const { PointsServiceImpl } = jest.requireMock("@/features/points/service");
// jest.mockの巻き上げにより、モック定義後でも問題なくハンドラーをimportできる
import PointsApiHandler from "@/app/api/points/PointsApiHandler";
```

`route.ts` は `createApiHandler` に渡すだけの薄いラッパーのため、個別のテストは不要。
`createApiHandler` / `createApiHandlerWithParams` 自体の挙動は
`__tests__/app/api/utils/apiHandler.test.ts` で確認する。

### テストデータ

Prisma のモデルは必須カラムが多いため、`helpers/factories.ts` のファクトリを使い、
検証に関係する項目だけを override する。

```ts
buildStation({ stationType: StationType.plus, stationGrade: StationGrade.a });
```

主なファクトリ: `buildEvent` / `buildEventType` / `buildStation` / `buildStations` /
`buildNearbyStation` / `buildBidirectionalNearbyStations` / `buildTeam` / `buildTeamData` /
`buildGoalStation` / `buildTransitStation` / `buildLatestTransitStation` / `buildPoints` /
`buildPropertyPurchase` / `buildPropertyPurchaseWithRelations` / `buildBombiiHistory` /
`buildDocument` / `buildUser` / `buildAttendance`。

新しいモデルのテストデータが必要になったら、テストファイル内にリテラルを書かず
`factories.ts` にファクトリを追加する。

## 書き方の指針

### 1. 誤った挙動をテストで固定しない

既存実装にバグを見つけた場合、その挙動を正解として `expect` に書かない。
`it.failing` で「本来あるべき挙動」を書き残し、コメントで理由を説明する。
修正されるとこのテストは失敗するため、`.failing` を外す契機になる。

```ts
// FIXME 目的駅が未設定の場合、remainingStationsNumberの算出で目的駅コード=""を
// グラフ上で探索できずエラーとなり、InternalServerErrorに変換されてしまう。
// 本来はnextGoalStation: nullを含むレスポンスを返すべき。
it.failing("次の目的駅が存在しない場合はnullを返す", async () => {
  findLatestGoalStation.mockResolvedValue(null);

  const res = await InitHomeServiceImpl.getDataForHome({
    eventCode: TEST_EVENT_CODE,
  });

  expect(res.nextGoalStation).toBeNull();
});
```

バグを修正したら `.failing` を外して通常の `it` に戻す。

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

### 5. spy は必ず戻す

`jest.spyOn` を使ったテストは `afterEach(() => jest.restoreAllMocks())` を置く。
戻し忘れると、同じファイル内の後続テストや実行順によって結果が変わる。

## テストではないもの

実行のたびに結果が変わる検証スクリプトや、DB 接続を前提とした分析ツールは
テストではなく `tools/` 配下に置き、`npx tsx` で直接実行する。

- `tools/roulette-weighted-station-simulator/` : 目的駅ルーレットのシミュレーション
- `tools/roulette-probability-analyzer/` : 目的駅の出現確率の分析
- `tools/routemap-checker/` : 路線図設定ファイルの整合性チェック
- `tools/station-distance-calculator/` : 駅間距離（移動時間）の算出

手動での API 疎通確認は `test/http/testAPI.http`（REST Client 拡張機能）を使う。
