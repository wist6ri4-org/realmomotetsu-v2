import type { NextConfig } from "next";

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
