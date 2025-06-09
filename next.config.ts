import type { NextConfig } from "next";
import "@dotenvx/dotenvx/config";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/pdf/:filename.pdf",
        destination: "/api/pdf/:filename",
      },
    ];
  },
  env: {
    NEXT_PUBLIC_HCAPTCHA_SITE_KEY: process.env.HCAPTCHA_SITE_KEY,
    NEXT_PUBLIC_API_ENDPOINT: process.env.API_ENDPOINT,
  },
};

export default nextConfig;
