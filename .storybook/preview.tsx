import type { Preview } from "@storybook/nextjs-vite";
import React from "react";
import { mswLoader } from "msw-storybook-addon/csf3";
import ThemeRegistry from "../src/components/ThemeRegistry";
import { UserIconProvider } from "../src/contexts/UserIconContext";
import { passthroughDefaultHandlers } from "../src/stories/mocks/handlers";

// MSWワーカーを起動するloader（`public/mockServiceWorker.js`は`npm run msw:init`で生成済み）。
// 個別のstoryでハンドルしていないリクエストは素通しし、無関係なエラーでstoryが落ちないようにする。
const mswStorybookLoader = mswLoader(async () => {
    const { setupWorker } = await import("msw/browser");
    const workerInstance = setupWorker();
    await workerInstance.start({ onUnhandledRequest: "bypass" });
    return workerInstance;
});

// geolocation・matchMedia等、ブラウザAPIのうちheadless実行環境で未実装/不安定なものをスタブする。
// `src/app/events/v03/[eventCode]/form/page.tsx` 等が起動時に無条件で呼び出すため必須。
if (typeof navigator !== "undefined") {
    Object.defineProperty(navigator, "geolocation", {
        configurable: true,
        value: {
            getCurrentPosition: (success: PositionCallback) => {
                success({
                    coords: {
                        latitude: 35.681236,
                        longitude: 139.767125,
                        accuracy: 10,
                        altitude: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: null,
                        toJSON: () => ({}),
                    },
                    timestamp: Date.now(),
                    toJSON: () => ({}),
                } as GeolocationPosition);
            },
            watchPosition: () => 0,
            clearWatch: () => undefined,
        },
    });
}

const preview: Preview = {
    parameters: {
        layout: "fullscreen",
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
        a11y: {
            test: "todo",
        },
        nextjs: {
            appDirectory: true,
        },
        // 画面試験・複合コンポーネント試験の描画経路に載るが検証対象ではないAPI
        // （例: RoutemapDialogが叩く /api/init-routemap）をまとめて黙らせる。
        // `handlers`はRecordのため、story側で`parameters.msw.handlers.<キー>`を追加すると
        // このdefaultとマージされる（Storybookの`parameters`は配列は置換・objectはマージされる仕様）。
        msw: {
            handlers: {
                default: passthroughDefaultHandlers,
            },
        },
    },
    loaders: [mswStorybookLoader],
    decorators: [
        (Story) => (
            <ThemeRegistry>
                <UserIconProvider>
                    <Story />
                </UserIconProvider>
            </ThemeRegistry>
        ),
    ],
};

export default preview;
