import type { NextConfig } from "next";

/**
 * Next.js の設定
 * @type {NextConfig}
 * @see https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
const nextConfig: NextConfig = {
    outputFileTracingIncludes: {
        "/api/current-location": ["./src/templates/discord/*.txt"],
        "/api/current-location-v3": ["./src/templates/discord/*.txt"],
        "/api/goal-stations": ["./src/templates/discord/*.txt"],
        "/api/goal-stations-v3": ["./src/templates/discord/*.txt"],
        "/api/bombii-histories": ["./src/templates/discord/*.txt"],
    },
    compiler: {
        emotion: true,
    },
    experimental: {
        optimizePackageImports: ["@mui/material", "@mui/icons-material"],
    },

    // ルートパスのリダイレクト設定
    // NOTE 特定のパスへのアクセスをNext.js側でリダイレクトするための設定。2025.9現在不要。学習用に残している。
    // async redirects() {
    //     return [
    //         {
    //             source: "/",
    //             destination: "/user/signin",
    //             permanent: true,
    //         },
    //     ];
    // },
};

export default nextConfig;
