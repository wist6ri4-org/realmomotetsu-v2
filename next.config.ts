import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    compiler: {
        emotion: true,
    },
    experimental: {
        optimizePackageImports: ["@mui/material", "@mui/icons-material"],
    },
};

export default nextConfig;
