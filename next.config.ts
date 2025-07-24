import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    compiler: {
        emotion: true,
    },
    experimental: {
        optimizePackageImports: ["@mui/material", "@mui/icons-material"],
    },
    async redirects() {
        return [
            {
                source: "/",
                destination: "/home",
                permanent: true,
            },
        ]
    },
};

export default nextConfig;
