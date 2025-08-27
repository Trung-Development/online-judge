import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
    cssChunking: true,
    authInterrupts: true,
    optimizePackageImports: [],
    optimizeCss: true,
  },
  webpack: (config, { dev }) => {
    // Only apply esbuild-loader to our source files, not node_modules or Next.js internals
    config.module.rules.unshift({
      test: /\.(ts|tsx|js|jsx)$/,
      include: [
        /src/, // Only process files in src directory
      ],
      exclude: /node_modules/,
      use: {
        loader: "esbuild-loader",
        options: {
          loader: "tsx",
          target: dev ? "es2017" : "es2015",
          jsx: "automatic",
        },
      },
    });

    return config;
  },
  env: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
    NEXT_PUBLIC_API_ENDPOINT: process.env.API_ENDPOINT,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gravatar.com",
        port: "",
        pathname: "/avatar/**",
      },
    ],
  },
};

export default nextConfig;
