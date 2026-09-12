/**
 * Storybook（画面レベル結合試験）用のMSWハンドラー
 *
 * `src/app/api/utils/BaseApiHandler.ts`が生成する成功レスポンスのエンベロープ
 * `{ data, requestId, timestamp }` に揃えている。
 * 各エンドポイントごとに success / empty / error / delayed のバリエーションを用意し、
 * storyの`parameters.msw.handlers`で必要な分だけ組み合わせて使う。
 */

import { delay, http, HttpResponse, type HttpHandler } from "msw";

const successEnvelope = (data: unknown) => ({
    data,
    requestId: "storybook-request-id",
    timestamp: new Date().toISOString(),
});

const errorEnvelope = (message: string) => ({
    error: message,
    requestId: "storybook-request-id",
    timestamp: new Date().toISOString(),
});

/**
 * 指定パスに対する成功/空/エラー/遅延の4バリエーションのハンドラーを作るヘルパー
 * @param {"get" | "post" | "put" | "patch"} method - HTTPメソッド
 * @param {string} path - MSWのパスパターン（例: "/api/init-home"）
 * @param {unknown} emptyData - 空データ時のレスポンスボディ（省略時は`success`と同じ関数を使う）
 */
const createHandlerFactory = <TData>(method: "get" | "post" | "put" | "patch", path: string, emptyData?: TData) => {
    const methodFn = http[method];

    return {
        success: (data: TData): HttpHandler => methodFn(path, () => HttpResponse.json(successEnvelope(data))),
        empty: (): HttpHandler =>
            methodFn(path, () => HttpResponse.json(successEnvelope(emptyData ?? ([] as unknown as TData)))),
        error: (status: number = 500, message: string = "Internal Server Error"): HttpHandler =>
            methodFn(path, () => HttpResponse.json(errorEnvelope(message), { status })),
        delayed: (data: TData, ms: number = 2000): HttpHandler =>
            methodFn(path, async () => {
                await delay(ms);
                return HttpResponse.json(successEnvelope(data));
            }),
    };
};

export const initHandlers = createHandlerFactory("get", "/api/init");
export const initHomeHandlers = createHandlerFactory("get", "/api/init-home");
export const initOperationHandlers = createHandlerFactory("get", "/api/init-operation");
export const initRouletteHandlers = createHandlerFactory("get", "/api/init-roulette");
export const initRoutemapHandlers = createHandlerFactory("get", "/api/init-routemap");

export const goalStationsLatestHandlers = createHandlerFactory("get", "/api/goal-stations/latest");
export const transitStationsLatestHandlers = createHandlerFactory("get", "/api/transit-stations/latest");

export const goalStationsHandlers = createHandlerFactory("post", "/api/goal-stations");
export const pointsHandlers = createHandlerFactory("post", "/api/points");
export const pointsUpdateHandlers = createHandlerFactory("put", "/api/points");
export const pointsBulkHandlers = createHandlerFactory("post", "/api/points/bulk");
export const bombiiHistoriesHandlers = createHandlerFactory("post", "/api/bombii-histories");
export const propertyPurchasesHandlers = createHandlerFactory("post", "/api/property-purchases");
export const currentLocationHandlers = createHandlerFactory("post", "/api/current-location");
export const currentLocationV3Handlers = createHandlerFactory("post", "/api/current-location-v3");
export const arrivalGoalStationV3Handlers = createHandlerFactory("post", "/api/arrival-goal-station-v3");
export const verifyArrivalGoalStationV3Handlers = createHandlerFactory(
    "post",
    "/api/verify/verify-arrival-goal-station-v3"
);
export const discordNotifyHandlers = createHandlerFactory("post", "/api/discord/notify");

/**
 * どの画面試験でも実質的に無害な「常に成功・データなし」を返すデフォルトハンドラー群。
 * `RoutemapDialog`（イベントレイアウトが表示する`/api/init-routemap`）など、
 * 個別のstoryでは検証対象でないが描画経路に含まれるAPIをまとめて黙らせるために使う。
 */
export const passthroughDefaultHandlers: HttpHandler[] = [
    initRoutemapHandlers.success({ teamData: [], nextGoalStation: null, bombiiTeam: null, propertyPurchases: [] }),
    discordNotifyHandlers.success({}),
];
