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
    async redirects() {
        return [
            {
                source: "/",
                destination: "/user/signin",
                permanent: true,
            },
        ];
    },
};

export default nextConfig;
