import type { NextConfig } from "next";

/**
 * Next.js の設定
 * @type {NextConfig}
 * @see https://nextjs.org/docs/api-reference/next.config.js/introduction
 */
const nextConfig: NextConfig = {
    compiler: {
        emotion: true,
    },
    experimental: {
        optimizePackageImports: ["@mui/material", "@mui/icons-material"],
    },
    eslint: {
        ignoreDuringBuilds: true,
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
