import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig, type ViteUserConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

/**
 * Storybookのplay function（結合試験）をブラウザ上（Playwright/Chromium）で実行するためのVitest設定。
 *
 * NOTE: 既存の単体試験（`__tests__/**`）はJest（`jest.config.js`、`npx jest`）で実行しており、
 *       このファイルはStorybookのstory indexのみを対象とする別系統のため競合しない。
 */
const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(async (): Promise<ViteUserConfig> => ({
    resolve: {
        alias: {
            // `@/generated/prisma`（tsconfigのpathエイリアス）は、この生成物の package.json の
            // legacy `browser`フィールド経由で `default.js` に解決されることがある。
            // `default.js` は `module.exports = { ...require('#main-entry-point') }`という
            // 動的spreadで再exportしており、Viteの静的named export解析（cjs-module-lexer）が
            // enum等のnamed exportを検出できずビルドエラーになる。
            // ブラウザ向けの静的exportを持つ`index-browser.js`を直接指すことで回避する。
            "@/generated/prisma": path.join(dirname, "src/generated/prisma/index-browser.js"),
        },
    },
    // `@/generated/prisma`はプロジェクト内ローカルファイル（CommonJS）のため、Viteは既定では
    // node_modules内の依存関係のようにesbuildによるCJS→ESM変換（named export検出）を適用しない。
    // `optimizeDeps.include`に明示的に加えることで、同じ変換パイプラインに乗せる。
    optimizeDeps: {
        include: ["@/generated/prisma"],
    },
    plugins: [...(await storybookTest({ configDir: path.join(dirname, ".storybook") }))],
    test: {
        name: "storybook",
        browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
        },
    },
}));
