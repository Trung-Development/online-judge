import type { NextConfig } from "next";

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
  },
};

export default nextConfig;
