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
    images: {
        formats: ["image/avif", "image/webp"],
    },
    // public 配下の静的画像をキャッシュする（同名で差し替える運用があるため immutable にはしない）
    async headers() {
        return [
            {
                source: "/:path*.(png|jpg|jpeg|webp|avif|svg)",
                headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
            },
        ];
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
