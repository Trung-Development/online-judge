import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
    cssChunking: true,
    authInterrupts: true,
    optimizePackageImports: [],
    optimizeCss: true,
  },
  async rewrites() {
    return [
      {
        source: "/pdf/:filename.pdf",
        destination: "/api/pdf/:filename",
      },
    ];
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