import path from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/nextjs-vite";

const dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Storybookのメイン設定
 * @see https://storybook.js.org/docs/api/main-config/main-config
 */
const config: StorybookConfig = {
    stories: ["../src/components/**/*.stories.@(ts|tsx)", "../src/stories/**/*.stories.@(ts|tsx)"],
    addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest", "msw-storybook-addon"],
    framework: {
        name: "@storybook/nextjs-vite",
        options: {},
    },
    staticDirs: ["../public"],
    // NOTE: `src/lib/supabase.ts` はモジュール読み込み時に
    //       `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", ...)` を実行し、
    //       URLが空文字だと@supabase/supabase-jsがimport時に例外を投げる。
    //       Storybook上ではSupabaseへの実通信は行わないため、ダミー値を注入して起動を通す。
    env: (envConfig) => ({
        ...envConfig,
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHED_KEY: "storybook-dummy-anon-key",
        NEXT_PUBLIC_BASE_URL: "http://localhost:3001",
    }),
    // `@/generated/prisma`がpackage.jsonのlegacy `browser`フィールド経由で`default.js`
    // （動的spreadの再exportで、Viteの静的named export解析が通らない）に解決されるのを避け、
    // 静的exportを持つ`index-browser.js`を直接指す。詳細は`vitest.config.ts`のコメントを参照。
    //
    // `optimizeDeps.include`は`vitest.config.ts`（addon-vitestのブラウザテスト実行）側では
    // named export解決に必須だったため、同じ変換パイプラインに乗せる意味で`storybook dev`側にも
    // 念のため揃えている（`storybook dev`単体ではaliasのみで再現しないことをPlaywrightで確認済み）。
    async viteFinal(viteConfig) {
        viteConfig.resolve = viteConfig.resolve ?? {};
        viteConfig.resolve.alias = {
            ...viteConfig.resolve.alias,
            "@/generated/prisma": path.join(dirname, "../src/generated/prisma/index-browser.js"),
        };
        viteConfig.optimizeDeps = viteConfig.optimizeDeps ?? {};
        viteConfig.optimizeDeps.include = [...(viteConfig.optimizeDeps.include ?? []), "@/generated/prisma"];
        return viteConfig;
    },
};

export default config;
